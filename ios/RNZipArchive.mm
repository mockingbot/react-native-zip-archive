//
//  RNZipArchive.mm
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "RNZipArchive.h"
#if __has_include(<SSZipArchive/minizip/mz_compat.h>)
#import <SSZipArchive/minizip/mz_compat.h>
#else
#import "mz_compat.h"
#endif
#import <zlib.h>
#import <fcntl.h>
#import <unistd.h>

#if __has_include(<React/RCTEventDispatcher.h>)
#import <React/RCTEventDispatcher.h>
#else
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#endif

static NSString *const kZipErrFileNotFound = @"ERR_FILE_NOT_FOUND";
static NSString *const kZipErrInvalidPath = @"ERR_INVALID_PATH";
static NSString *const kZipErrInvalidArgs = @"ERR_INVALID_ARGS";
static NSString *const kZipErrWrongPassword = @"ERR_WRONG_PASSWORD";
static NSString *const kZipErrNotPasswordProtected = @"ERR_NOT_PASSWORD_PROTECTED";
static NSString *const kZipErrCorruptArchive = @"ERR_CORRUPT_ARCHIVE";
static NSString *const kZipErrUnsafePath = @"ERR_UNSAFE_PATH";
static NSString *const kZipErrCancelled = @"ERR_CANCELLED";
static NSString *const kZipErrZip = @"ERR_ZIP";
static NSString *const kZipErrUnzip = @"ERR_UNZIP";
static NSString *const kZipErrUnsupported = @"ERR_UNSUPPORTED";

@interface RNZipCancelDelegate : NSObject <SSZipArchiveDelegate>
@property (nonatomic, weak) RNZipArchive *owner;
@end

@implementation RNZipCancelDelegate
- (BOOL)zipArchiveShouldUnzipFileAtIndex:(NSInteger)fileIndex
                              totalFiles:(NSInteger)totalFiles
                             archivePath:(NSString *)archivePath
                                fileInfo:(unz_file_info)fileInfo {
    (void)fileIndex;
    (void)totalFiles;
    (void)archivePath;
    (void)fileInfo;
    return self.owner != nil && !self.owner.cancelled;
}
@end

@implementation RNZipArchive
{
  bool hasListeners;
}

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeZipArchiveSpecJSI>(params);
}
#endif

// Will be called when this module's first listener is added.
-(void)startObserving {
    hasListeners = YES;
    // Set up any upstream listeners or background tasks as necessary
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    hasListeners = NO;
    // Remove upstream listeners, stop unnecessary background tasks
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"zipArchiveProgressEvent"];
}

- (void)beginOperation {
    self.cancelled = NO;
}

- (dispatch_queue_t)workQueue {
    static dispatch_queue_t queue;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        queue = dispatch_queue_create("com.mockingbot.ReactNative.ZipArchiveWorkQueue", DISPATCH_QUEUE_SERIAL);
    });
    return queue;
}

- (void)runAsync:(void (^)(void))block {
    dispatch_async([self workQueue], block);
}

- (BOOL)rejectIfCancelled:(RCTPromiseRejectBlock)reject {
    if (self.cancelled) {
        reject(kZipErrCancelled, @"Operation cancelled", nil);
        return YES;
    }
    return NO;
}

- (void)cancel:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
    (void)reject;
    self.cancelled = YES;
    resolve(nil);
}

- (void)isPasswordProtected:(NSString *)file
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    (void)reject;
    [self beginOperation];
    [self runAsync:^{
        BOOL isPasswordProtected = [SSZipArchive isFilePasswordProtectedAtPath:file];
        resolve([NSNumber numberWithBool:isPasswordProtected]);
    }];
}

- (void)unzip:(NSString *)from
destinationPath:(NSString *)destinationPath
      charset:(NSString *)charset
      entries:(NSArray *)entries
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject {
    (void)charset;
    [self beginOperation];
    [self runAsync:^{
        if (entries != nil && entries.count > 0) {
            [self unzipSelectedEntries:from
                       destinationPath:destinationPath
                               entries:entries
                              password:nil
                               resolve:resolve
                                reject:reject];
            return;
        }
        [self unzipFile:from destinationPath:destinationPath password:nil resolve:resolve reject:reject];
    }];
}

- (void)unzipWithPassword:(NSString *)from
        destinationPath:(NSString *)destinationPath
               password:(NSString *)password
                entries:(NSArray *)entries
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
    [self beginOperation];
    [self runAsync:^{
        if (entries != nil && entries.count > 0) {
            [self unzipSelectedEntries:from
                       destinationPath:destinationPath
                               entries:entries
                              password:password
                               resolve:resolve
                                reject:reject];
            return;
        }
        [self unzipFile:from destinationPath:destinationPath password:password resolve:resolve reject:reject];
    }];
}

- (void)listContents:(NSString *)source
             charset:(NSString *)charset
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
    (void)charset; // iOS always reads entry names as UTF-8 / Latin-1 fallback
    [self beginOperation];
    [self runAsync:^{
        zipFile zip = unzOpen(source.fileSystemRepresentation);
        if (zip == NULL) {
            reject(kZipErrFileNotFound, @"failed to open zip file", nil);
            return;
        }

        NSMutableArray *entries = [NSMutableArray array];
        // Empty archives return a non-UNZ_OK code from unzGoToFirstFile; treat as an empty list.
        int ret = unzGoToFirstFile(zip);
        while (ret == UNZ_OK) {
            NSString *path = nil;
            unsigned long long size = 0;
            unsigned long long compressedSize = 0;
            BOOL isDirectory = NO;
            BOOL isEncrypted = NO;
            NSString *entryError = nil;
            if (![self readCurrentZipEntry:zip
                                      path:&path
                                      size:&size
                            compressedSize:&compressedSize
                               isDirectory:&isDirectory
                               isEncrypted:&isEncrypted
                                     error:&entryError]) {
                unzClose(zip);
                reject(kZipErrCorruptArchive, entryError ?: @"failed to retrieve info for zip entry", nil);
                return;
            }

            [entries addObject:@{
                @"path": path,
                @"size": @((double)size),
                @"compressedSize": @((double)compressedSize),
                @"isDirectory": @(isDirectory),
                @"isEncrypted": @(isEncrypted),
            }];

            ret = unzGoToNextFile(zip);
        }

        unzClose(zip);
        resolve(entries);
    }];
}

- (BOOL)readCurrentZipEntry:(unzFile)zip
                       path:(NSString **)outPath
                       size:(unsigned long long *)outSize
             compressedSize:(unsigned long long *)outCompressedSize
                isDirectory:(BOOL *)outIsDirectory
                isEncrypted:(BOOL *)outIsEncrypted
                      error:(NSString **)outError {
    unz_file_info64 fileInfo;
    memset(&fileInfo, 0, sizeof(fileInfo));
    int ret = unzGetCurrentFileInfo64(zip, &fileInfo, NULL, 0, NULL, 0, NULL, 0);
    if (ret != UNZ_OK) {
        if (outError != NULL) {
            *outError = @"failed to retrieve info for zip entry";
        }
        return NO;
    }

    size_t nameLen = (size_t)fileInfo.size_filename;
    char *filename = (char *)malloc(nameLen + 1);
    if (filename == NULL) {
        if (outError != NULL) {
            *outError = @"out of memory while reading zip entry";
        }
        return NO;
    }
    unzGetCurrentFileInfo64(zip, &fileInfo, filename, nameLen + 1, NULL, 0, NULL, 0);
    filename[nameLen] = '\0';

    NSString *path = [NSString stringWithUTF8String:filename];
    if (path == nil) {
        path = [[NSString alloc] initWithBytes:filename
                                        length:nameLen
                                      encoding:NSISOLatin1StringEncoding];
    }
    BOOL isDirectory = NO;
    if (nameLen > 0 && (filename[nameLen - 1] == '/' || filename[nameLen - 1] == '\\')) {
        isDirectory = YES;
    }
    free(filename);

    if (outPath != NULL) {
        *outPath = path ?: @"";
    }
    if (outSize != NULL) {
        *outSize = (unsigned long long)fileInfo.uncompressed_size;
    }
    if (outCompressedSize != NULL) {
        *outCompressedSize = (unsigned long long)fileInfo.compressed_size;
    }
    if (outIsDirectory != NULL) {
        *outIsDirectory = isDirectory;
    }
    if (outIsEncrypted != NULL) {
        *outIsEncrypted = (fileInfo.flag & 1) != 0;
    }
    return YES;
}

- (NSString *)normalizedZipPath:(NSString *)path {
    NSString *normalized = [path stringByReplacingOccurrencesOfString:@"\\" withString:@"/"];
    while ([normalized hasSuffix:@"/"] && normalized.length > 0) {
        normalized = [normalized substringToIndex:normalized.length - 1];
    }
    return normalized;
}

- (BOOL)entry:(NSString *)entryName matchesSelection:(NSArray<NSString *> *)wantedEntries {
    if (entryName == nil || wantedEntries.count == 0) {
        return NO;
    }
    NSString *normalizedEntry = [self normalizedZipPath:entryName];
    for (NSString *wanted in wantedEntries) {
        if (wanted.length == 0) {
            continue;
        }
        NSString *normalizedWanted = [self normalizedZipPath:wanted];
        if ([normalizedEntry isEqualToString:normalizedWanted]) {
            return YES;
        }
        NSString *prefix = [normalizedWanted stringByAppendingString:@"/"];
        if ([normalizedEntry hasPrefix:prefix]) {
            return YES;
        }
    }
    return NO;
}

- (BOOL)isSafeExtractPath:(NSString *)entryName intoDestination:(NSString *)destinationPath {
    if (entryName.length == 0) {
        return NO;
    }
    NSString *fullPath = [destinationPath stringByAppendingPathComponent:entryName];
    NSString *standardizedDest = [[destinationPath stringByStandardizingPath] stringByAppendingString:@"/"];
    NSString *standardizedFull = [fullPath stringByStandardizingPath];
    return [standardizedFull hasPrefix:standardizedDest] ||
           [standardizedFull isEqualToString:[destinationPath stringByStandardizingPath]];
}

- (void)unzipSelectedEntries:(NSString *)from
             destinationPath:(NSString *)destinationPath
                     entries:(NSArray *)entries
                    password:(NSString *)password
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
    if ([self rejectIfCancelled:reject]) {
        return;
    }
    if (entries.count == 0) {
        reject(kZipErrInvalidArgs, @"entries must be a non-empty array", nil);
        return;
    }

    if (password.length > 0 && ![SSZipArchive isFilePasswordProtectedAtPath:from]) {
        reject(kZipErrNotPasswordProtected,
               [NSString stringWithFormat:@"Zip file: %@ is not password protected", from],
               nil);
        return;
    }

    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1];

    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSError *dirError = nil;
    if (![fileManager fileExistsAtPath:destinationPath]) {
        [fileManager createDirectoryAtPath:destinationPath
               withIntermediateDirectories:YES
                                attributes:nil
                                     error:&dirError];
        if (dirError != nil) {
            reject(kZipErrUnzip, dirError.localizedDescription, dirError);
            return;
        }
    }

    zipFile zip = unzOpen(from.fileSystemRepresentation);
    if (zip == NULL) {
        reject(kZipErrFileNotFound, @"failed to open zip file", nil);
        return;
    }

    // First pass: compute total uncompressed size of matching entries for progress.
    unsigned long long totalSize = 0;
    NSUInteger matchCount = 0;
    int ret = unzGoToFirstFile(zip);
    while (ret == UNZ_OK) {
        if ([self rejectIfCancelled:reject]) {
            unzClose(zip);
            return;
        }
        NSString *path = nil;
        unsigned long long size = 0;
        if ([self readCurrentZipEntry:zip
                                 path:&path
                                 size:&size
                       compressedSize:NULL
                          isDirectory:NULL
                          isEncrypted:NULL
                                error:NULL] &&
            [self entry:path matchesSelection:entries]) {
            matchCount += 1;
            totalSize += size;
        }
        ret = unzGoToNextFile(zip);
    }

    if (matchCount == 0) {
        unzClose(zip);
        reject(kZipErrInvalidArgs, @"None of the requested entries were found in the archive", nil);
        return;
    }

    if (totalSize == 0) {
        totalSize = 1;
    }

    // Second pass: extract matching entries.
    unsigned long long extractedBytes = 0;
    BOOL success = YES;
    NSError *extractError = nil;
    NSString *extractCode = kZipErrUnzip;
    ret = unzGoToFirstFile(zip);
    while (ret == UNZ_OK) {
        NSString *strPath = nil;
        unsigned long long uncompressedSize = 0;
        BOOL isDirectory = NO;
        NSString *entryError = nil;
        if (![self readCurrentZipEntry:zip
                                  path:&strPath
                                  size:&uncompressedSize
                        compressedSize:NULL
                           isDirectory:&isDirectory
                           isEncrypted:NULL
                                 error:&entryError]) {
            success = NO;
            extractError = [NSError errorWithDomain:@"RNZipArchive"
                                               code:-1
                                           userInfo:@{NSLocalizedDescriptionKey: entryError ?: @"failed to retrieve info for zip entry"}];
            break;
        }

        if ([self rejectIfCancelled:reject]) {
            unzClose(zip);
            return;
        }

        if (strPath.length == 0 || ![self entry:strPath matchesSelection:entries]) {
            ret = unzGoToNextFile(zip);
            continue;
        }

        if ([strPath hasPrefix:@"__MACOSX/"]) {
            ret = unzGoToNextFile(zip);
            continue;
        }

        if (![self isSafeExtractPath:strPath intoDestination:destinationPath]) {
            success = NO;
            extractCode = kZipErrUnsafePath;
            extractError = [NSError errorWithDomain:@"RNZipArchive"
                                               code:-1
                                           userInfo:@{NSLocalizedDescriptionKey:
                                                          [NSString stringWithFormat:@"Found Zip Path Traversal Vulnerability with %@", strPath]}];
            break;
        }

        self.processedFilePath = strPath;
        NSString *fullPath = [destinationPath stringByAppendingPathComponent:strPath];

        if (isDirectory) {
            [fileManager createDirectoryAtPath:fullPath
                   withIntermediateDirectories:YES
                                    attributes:nil
                                         error:nil];
            extractedBytes += uncompressedSize;
            [self zipArchiveProgressEvent:extractedBytes total:totalSize];
            ret = unzGoToNextFile(zip);
            continue;
        }

        NSString *parentDir = [fullPath stringByDeletingLastPathComponent];
        [fileManager createDirectoryAtPath:parentDir
               withIntermediateDirectories:YES
                                attributes:nil
                                     error:nil];

        if (password.length > 0) {
            ret = unzOpenCurrentFilePassword(zip, [password cStringUsingEncoding:NSUTF8StringEncoding]);
        } else {
            ret = unzOpenCurrentFile(zip);
        }
        if (ret != UNZ_OK) {
            success = NO;
            extractCode = password.length > 0 ? kZipErrWrongPassword : kZipErrUnzip;
            extractError = [NSError errorWithDomain:@"RNZipArchive"
                                               code:-1
                                           userInfo:@{NSLocalizedDescriptionKey: password.length > 0
                                                          ? @"wrong password or failed to open encrypted zip entry"
                                                          : @"failed to open file in zip archive"}];
            break;
        }

        FILE *out = fopen(fullPath.fileSystemRepresentation, "wb");
        if (out == NULL) {
            unzCloseCurrentFile(zip);
            success = NO;
            extractError = [NSError errorWithDomain:@"RNZipArchive"
                                               code:-1
                                           userInfo:@{NSLocalizedDescriptionKey: @"failed to write extracted file"}];
            break;
        }

        unsigned char buffer[4096];
        int readBytes;
        do {
            if ([self rejectIfCancelled:reject]) {
                fclose(out);
                unzCloseCurrentFile(zip);
                unzClose(zip);
                return;
            }
            readBytes = unzReadCurrentFile(zip, buffer, sizeof(buffer));
            if (readBytes < 0) {
                success = NO;
                extractCode = password.length > 0 ? kZipErrWrongPassword : kZipErrUnzip;
                extractError = [NSError errorWithDomain:@"RNZipArchive"
                                                   code:-1
                                               userInfo:@{NSLocalizedDescriptionKey: @"failed to read zip entry"}];
                break;
            }
            if (readBytes > 0) {
                if (fwrite(buffer, 1, (size_t)readBytes, out) != (size_t)readBytes) {
                    success = NO;
                    extractError = [NSError errorWithDomain:@"RNZipArchive"
                                                       code:-1
                                                   userInfo:@{NSLocalizedDescriptionKey: @"failed to write extracted file"}];
                    break;
                }
            }
        } while (readBytes > 0);

        fclose(out);
        int closeRet = unzCloseCurrentFile(zip);
        if (success && closeRet != UNZ_OK) {
            success = NO;
            extractCode = password.length > 0 ? kZipErrWrongPassword : kZipErrCorruptArchive;
            extractError = [NSError errorWithDomain:@"RNZipArchive"
                                               code:-1
                                           userInfo:@{NSLocalizedDescriptionKey: @"failed to extract zip entry (wrong password or corrupt archive)"}];
        }

        if (!success) {
            break;
        }

        extractedBytes += uncompressedSize;
        [self zipArchiveProgressEvent:extractedBytes total:totalSize];
        ret = unzGoToNextFile(zip);
    }

    unzClose(zip);

    if (success) {
        self.progress = 1.0;
        [self zipArchiveProgressEvent:1 total:1];
        resolve(destinationPath);
    } else if (self.cancelled) {
        reject(kZipErrCancelled, @"Operation cancelled", nil);
    } else {
        self.progress = 0.0;
        [self zipArchiveProgressEvent:0 total:1];
        NSString *message = extractError ? extractError.localizedDescription : @"unable to unzip selected entries";
        reject(extractCode, message, extractError);
    }
}

- (void)unzipFile:(NSString *)from
destinationPath:(NSString *)destinationPath
      password:(NSString *)password
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject {
    if ([self rejectIfCancelled:reject]) {
        return;
    }
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSError *error = nil;

    // Total uncompressed size, used for byte-weighted progress. If it can't be
    // determined, fall back to per-entry progress (entryNumber / total).
    NSNumber *payloadSize = [SSZipArchive payloadSizeForArchiveAtPath:from error:nil];
    unsigned long long totalSize = payloadSize ? [payloadSize unsignedLongLongValue] : 0;

    __block unsigned long long extractedBytes = 0;
    __weak RNZipArchive *weakSelf = self;
    RNZipCancelDelegate *cancelDelegate = [RNZipCancelDelegate new];
    cancelDelegate.owner = self;

    BOOL success = [SSZipArchive unzipFileAtPath:from
                                  toDestination:destinationPath
                             preserveAttributes:NO
                                      overwrite:YES
                                 nestedZipLevel:0
                                       password:password
                                          error:&error
                                       delegate:cancelDelegate
                                progressHandler:^(NSString *entry, unz_file_info zipInfo, long entryNumber, long total) {
                                    RNZipArchive *strongSelf = weakSelf;
                                    if (strongSelf == nil) {
                                        return;
                                    }
                                    strongSelf.processedFilePath = entry;
                                    if (totalSize > 0) {
                                        extractedBytes += zipInfo.uncompressed_size;
                                        [strongSelf zipArchiveProgressEvent:extractedBytes total:totalSize];
                                    } else {
                                        [strongSelf zipArchiveProgressEvent:entryNumber total:total];
                                    }
                                }
                              completionHandler:nil];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (self.cancelled) {
        reject(kZipErrCancelled, @"Operation cancelled", nil);
    } else if (success) {
        resolve(destinationPath);
    } else {
        NSString *errorMessage = error ? [error localizedDescription] : @"unable to unzip";
        NSString *code = kZipErrUnzip;
        NSString *lower = errorMessage.lowercaseString;
        if ([lower containsString:@"password"]) {
            code = kZipErrWrongPassword;
        } else if ([lower containsString:@"failed to open zip"]) {
            code = kZipErrFileNotFound;
        }
        reject(code, errorMessage, error);
    }
}

- (void)zipFolder:(NSString *)from
  destinationPath:(NSString *)destinationPath
 compressionLevel:(double)compressionLevel
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject {
    [self beginOperation];
    [self runAsync:^{
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];

    success = [SSZipArchive createZipFileAtPath:destinationPath
                        withContentsOfDirectory:from
                            keepParentDirectory:NO
                               compressionLevel:[self zlibCompressionLevel:compressionLevel]
                                       password:nil
                                            AES:NO
                                progressHandler:self.progressHandler];
    if (success) {
        [self synchronizeZipFileAtPath:destinationPath];
    }

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (self.cancelled) {
        reject(kZipErrCancelled, @"Operation cancelled", nil);
    } else if (success) {
        resolve(destinationPath);
    } else {
        reject(kZipErrZip, @"unable to zip", nil);
    }
    }];
}

// Expands `paths` into (full path, entry name) pairs. Files keep their base
// name; directory contents are added recursively with entry names relative to
// the listed directory (e.g. "a.txt", "sub/b.txt"), matching Android's
// zip(string[]) behavior (#339). Directory entries themselves are not written.
// Returns nil if any path does not exist.
- (NSArray<NSArray<NSString *> *> *)expandedZipEntries:(NSArray<NSString *> *)paths {
    NSFileManager *fileManager = [[NSFileManager alloc] init];
    NSMutableArray<NSArray<NSString *> *> *entries = [NSMutableArray array];
    for (NSString *path in paths) {
        BOOL isDirectory = NO;
        if (![fileManager fileExistsAtPath:path isDirectory:&isDirectory]) {
            return nil;
        }
        if (!isDirectory) {
            [entries addObject:@[path, path.lastPathComponent]];
            continue;
        }
        NSDirectoryEnumerator *enumerator = [fileManager enumeratorAtPath:path];
        NSString *relativePath;
        while ((relativePath = [enumerator nextObject])) {
            NSString *fullPath = [path stringByAppendingPathComponent:relativePath];
            BOOL childIsDirectory = NO;
            [fileManager fileExistsAtPath:fullPath isDirectory:&childIsDirectory];
            if (childIsDirectory) {
                continue;
            }
            [entries addObject:@[fullPath, relativePath]];
        }
    }
    return entries;
}

- (int)zlibCompressionLevel:(double)compressionLevel {
    // Map JS compression constants onto zlib levels. Negative values mean default.
    if (compressionLevel < 0) {
        return Z_DEFAULT_COMPRESSION;
    }
    if (compressionLevel > 9) {
        return Z_BEST_COMPRESSION;
    }
    return (int)compressionLevel;
}

- (BOOL)usesAESForEncryptionType:(NSString *)encryptionType {
    // Empty / STANDARD → traditional ZipCrypto for maximum server-side compatibility.
    // AES-128 / AES-256 → WinZip AES (many Java/Node unzippers cannot read this).
    return encryptionType.length > 0 && ![encryptionType isEqualToString:@"STANDARD"];
}

/**
 * Flush zip bytes to durable storage before resolving. Callers that upload or hash
 * the archive immediately after `zip(...)` otherwise risk reading a partial file
 * (see #323 / #355-class races).
 */
- (void)synchronizeZipFileAtPath:(NSString *)path {
    int fd = open(path.fileSystemRepresentation, O_RDONLY);
    if (fd < 0) {
        return;
    }
    fsync(fd);
    close(fd);
}

- (BOOL)writeZipEntriesToPath:(NSString *)destinationPath
                        paths:(NSArray<NSString *> *)paths
             compressionLevel:(int)compressionLevel
                     password:(NSString *)password
                          AES:(BOOL)aes {
    NSArray<NSArray<NSString *> *> *entries = [self expandedZipEntries:paths];
    if (entries == nil) {
        return NO;
    }
    SSZipArchive *zipArchive = [[SSZipArchive alloc] initWithPath:destinationPath];
    BOOL success = [zipArchive open];
    if (success) {
        NSUInteger total = entries.count, complete = 0;
        for (NSArray<NSString *> *entry in entries) {
            if (self.cancelled) {
                success = NO;
                break;
            }
            success &= [zipArchive writeFileAtPath:entry[0] withFileName:entry[1] compressionLevel:compressionLevel password:password AES:aes];
            if (self.progressHandler) {
                complete++;
                self.progressHandler(complete, total);
            }
        }
        success &= [zipArchive close];
        if (success) {
            [self synchronizeZipFileAtPath:destinationPath];
        }
    }
    return success;
}

- (void)zipFiles:(NSArray<NSString *> *)from
 destinationPath:(NSString *)destinationPath
compressionLevel:(double)compressionLevel
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    [self beginOperation];
    [self runAsync:^{
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];

    // Honor the requested compression level (previously ignored for file arrays) and
    // never enable AES for plaintext zips — both matter for Node/Java unzippers (#333, #323).
    success = [self writeZipEntriesToPath:destinationPath
                                    paths:from
                         compressionLevel:[self zlibCompressionLevel:compressionLevel]
                                 password:nil
                                      AES:NO];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (self.cancelled) {
        reject(kZipErrCancelled, @"Operation cancelled", nil);
    } else if (success) {
        resolve(destinationPath);
    } else {
        reject(kZipErrZip, @"unable to zip", nil);
    }
    }];
}

- (void)zipFolderWithPassword:(NSString *)from
              destinationPath:(NSString *)destinationPath
                     password:(NSString *)password
               encryptionType:(NSString *)encryptionType
             compressionLevel:(double)compressionLevel
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject {
    [self beginOperation];
    [self runAsync:^{
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];
    BOOL useAES = [self usesAESForEncryptionType:encryptionType];
    success = [SSZipArchive createZipFileAtPath:destinationPath
                        withContentsOfDirectory:from
                            keepParentDirectory:NO
                               compressionLevel:[self zlibCompressionLevel:compressionLevel]
                                       password:password
                                            AES:useAES
                                progressHandler:self.progressHandler];
    if (success) {
        [self synchronizeZipFileAtPath:destinationPath];
    }

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (self.cancelled) {
        reject(kZipErrCancelled, @"Operation cancelled", nil);
    } else if (success) {
        resolve(destinationPath);
    } else {
        reject(kZipErrZip, @"unable to zip", nil);
    }
    }];
}

- (void)zipFilesWithPassword:(NSArray<NSString *> *)from
             destinationPath:(NSString *)destinationPath
                    password:(NSString *)password
              encryptionType:(NSString *)encryptionType
            compressionLevel:(double)compressionLevel
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
    [self beginOperation];
    [self runAsync:^{
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];
    // Prefer STANDARD (ZipCrypto) unless the caller explicitly requests AES.
    // Always-on AES was a common source of "works on device, fails on server" reports.
    BOOL useAES = [self usesAESForEncryptionType:encryptionType];
    success = [self writeZipEntriesToPath:destinationPath
                                    paths:from
                         compressionLevel:[self zlibCompressionLevel:compressionLevel]
                                 password:password
                                      AES:useAES];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (self.cancelled) {
        reject(kZipErrCancelled, @"Operation cancelled", nil);
    } else if (success) {
        resolve(destinationPath);
    } else {
        reject(kZipErrZip, @"unable to zip", nil);
    }
    }];
}

- (void)getUncompressedSize:(NSString *)path
                    charset:(NSString *)charset
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    (void)charset;
    [self beginOperation];
    [self runAsync:^{
    NSError *error = nil;
    NSNumber *wantedFileSize = [SSZipArchive payloadSizeForArchiveAtPath:path error:&error];

    if (error == nil) {
        resolve(wantedFileSize);
    } else {
        resolve(@-1);
    }
    }];
}

- (void)unzipAssets:(NSString *)source
             target:(NSString *)target
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
    // iOS doesn't have assets like Android, return error
    NSError *error = [NSError errorWithDomain:@"RNZipArchive" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"unzipAssets is not supported on iOS"}];
    reject(kZipErrUnsupported, @"unzipAssets is not supported on iOS", error);
}

- (void)addListener:(NSString *)eventName {
    [super addListener:eventName];
}

- (void)removeListeners:(double)count {
    [super removeListeners:count];
}

- (dispatch_queue_t)methodQueue {
    static dispatch_queue_t queue;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        queue = dispatch_queue_create("com.mockingbot.ReactNative.ZipArchiveQueue", DISPATCH_QUEUE_SERIAL);
    });
    return queue;
}

- (void)zipArchiveProgressEvent:(unsigned long long)loaded total:(unsigned long long)total  {
    self.progress = (float)loaded / (float)total;
    [self dispatchProgessEvent:self.progress processedFilePath:self.processedFilePath];
}

- (void)setProgressHandler {
    __weak RNZipArchive *weakSelf = self;
    self.progressHandler = ^(NSUInteger entryNumber, NSUInteger total) {
        [weakSelf zipArchiveProgressEvent:entryNumber total:total];
    };
}

- (void)dispatchProgessEvent:(float)progress processedFilePath:(NSString *)processedFilePath {
    if (hasListeners) {
        [self sendEventWithName:@"zipArchiveProgressEvent" body:@{@"progress": @(progress), @"filePath": processedFilePath}];
    }
}

@end
