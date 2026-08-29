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
#elif __has_include("mz_compat.h")
#import "mz_compat.h"
#else
#import "unzip.h"
#endif
#import <zlib.h>

#if __has_include(<React/RCTEventDispatcher.h>)
#import <React/RCTEventDispatcher.h>
#else
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#endif

@implementation RNZipArchive
{
  bool hasListeners;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

-(void)startObserving {
    hasListeners = YES;
}

-(void)stopObserving {
    hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"zipArchiveProgressEvent"];
}

RCT_EXPORT_METHOD(isPasswordProtected:(NSString *)file
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    BOOL isPasswordProtected = [SSZipArchive isFilePasswordProtectedAtPath:file];
    resolve([NSNumber numberWithBool:isPasswordProtected]);
}

RCT_EXPORT_METHOD(unzip:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  charset:(NSString *)charset
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    (void)charset;
    [self extractZipArchive:from destinationPath:destinationPath password:nil resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(unzipWithPassword:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self extractZipArchive:from destinationPath:destinationPath password:password resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(zipFolder:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  compressionLevel:(double)compressionLevel
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1];

    BOOL success;
    [self setProgressHandler];

    success = [SSZipArchive createZipFileAtPath:destinationPath
                        withContentsOfDirectory:from
                            keepParentDirectory:NO
                               compressionLevel:compressionLevel
                                       password:nil
                                            AES:NO
                                progressHandler:self.progressHandler];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1];

    if (success) {
        resolve(destinationPath);
    } else {
        reject(@"zip_error", @"unable to zip", nil);
    }
}

RCT_EXPORT_METHOD(zipFiles:(NSArray<NSString *> *)from
                  destinationPath:(NSString *)destinationPath
                  compressionLevel:(double)compressionLevel
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    (void)compressionLevel;
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1];

    BOOL success;
    [self setProgressHandler];

    success = [SSZipArchive createZipFileAtPath:destinationPath withFilesAtPaths:from];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1];

    if (success) {
        resolve(destinationPath);
    } else {
        reject(@"zip_error", @"unable to zip", nil);
    }
}

RCT_EXPORT_METHOD(zipFolderWithPassword:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  password:(NSString *)password
                  encryptionType:(NSString *)encryptionType
                  compressionLevel:(double)compressionLevel
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1];

    BOOL success;
    [self setProgressHandler];
    BOOL useAES = encryptionType && ![encryptionType isEqualToString:@"STANDARD"];
    success = [SSZipArchive createZipFileAtPath:destinationPath
                        withContentsOfDirectory:from
                            keepParentDirectory:NO
                               compressionLevel:compressionLevel
                                       password:password
                                            AES:useAES
                                progressHandler:self.progressHandler];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1];

    if (success) {
        resolve(destinationPath);
    } else {
        reject(@"zip_error", @"unable to zip", nil);
    }
}

RCT_EXPORT_METHOD(zipFilesWithPassword:(NSArray<NSString *> *)from
                  destinationPath:(NSString *)destinationPath
                  password:(NSString *)password
                  encryptionType:(NSString *)encryptionType
                  compressionLevel:(double)compressionLevel
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    (void)encryptionType;
    (void)compressionLevel;
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1];

    BOOL success;
    [self setProgressHandler];
    success = [SSZipArchive createZipFileAtPath:destinationPath withFilesAtPaths:from withPassword:password];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1];

    if (success) {
        resolve(destinationPath);
    } else {
        reject(@"zip_error", @"unable to zip", nil);
    }
}

RCT_EXPORT_METHOD(getUncompressedSize:(NSString *)path
                  charset:(NSString *)charset
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    (void)charset;
    (void)reject;
    NSError *error = nil;
    NSNumber *wantedFileSize = [SSZipArchive payloadSizeForArchiveAtPath:path error:&error];

    if (error == nil) {
        resolve(wantedFileSize);
    } else {
        resolve(@-1);
    }
}

- (BOOL)readCurrentZipEntry:(unzFile)zip
                       path:(NSString **)outPath
                       size:(unsigned long long *)outSize
                isDirectory:(BOOL *)outIsDirectory
                    version:(uLong *)outVersion
                 externalFa:(uLong *)outExternalFa
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
    if (outIsDirectory != NULL) {
        *outIsDirectory = isDirectory;
    }
    if (outVersion != NULL) {
        *outVersion = fileInfo.version;
    }
    if (outExternalFa != NULL) {
        *outExternalFa = fileInfo.external_fa;
    }
    return YES;
}

- (BOOL)isSymlinkZipEntryVersion:(uLong)version externalFa:(uLong)externalFa {
    const uLong ZipUNIXVersion = 3;
    const uLong BSD_SFMT = 0170000;
    const uLong BSD_IFLNK = 0120000;
    return ((version >> 8) == ZipUNIXVersion) && BSD_IFLNK == (BSD_SFMT & (externalFa >> 16));
}

- (BOOL)shouldSkipZipEntry:(NSString *)entryName
                   version:(uLong)version
                externalFa:(uLong)externalFa {
    if (entryName.length == 0) {
        return YES;
    }
    if ([entryName hasPrefix:@"__MACOSX/"]) {
        return YES;
    }
    if ([self isSymlinkZipEntryVersion:version externalFa:externalFa]) {
        return YES;
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

- (void)extractZipArchive:(NSString *)from
          destinationPath:(NSString *)destinationPath
                 password:(NSString *)password
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
    if (password.length > 0 && ![SSZipArchive isFilePasswordProtectedAtPath:from]) {
        reject(@"unzip_error",
               [NSString stringWithFormat:@"Zip file: %@ is not password protected", from],
               nil);
        return;
    }

    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1];

    NSFileManager *fileManager = [NSFileManager defaultManager];
    if (![fileManager fileExistsAtPath:destinationPath]) {
        [fileManager createDirectoryAtPath:destinationPath
               withIntermediateDirectories:YES
                                attributes:nil
                                     error:nil];
    }

    zipFile zip = unzOpen(from.fileSystemRepresentation);
    if (zip == NULL) {
        reject(@"unzip_error", @"failed to open zip file", nil);
        return;
    }

    unsigned long long totalSize = 0;
    int ret = unzGoToFirstFile(zip);
    while (ret == UNZ_OK) {
        NSString *path = nil;
        unsigned long long size = 0;
        uLong version = 0;
        uLong externalFa = 0;
        if ([self readCurrentZipEntry:zip
                                 path:&path
                                 size:&size
                          isDirectory:NULL
                              version:&version
                           externalFa:&externalFa
                                error:NULL]) {
            if ([self shouldSkipZipEntry:path version:version externalFa:externalFa]) {
                ret = unzGoToNextFile(zip);
                continue;
            }
            if (![self isSafeExtractPath:path intoDestination:destinationPath]) {
                unzClose(zip);
                reject(@"unzip_error",
                       [NSString stringWithFormat:@"Found Zip Path Traversal Vulnerability with %@", path],
                       nil);
                return;
            }
            totalSize += size;
        }
        ret = unzGoToNextFile(zip);
    }
    if (totalSize == 0) {
        totalSize = 1;
    }

    unsigned long long extractedBytes = 0;
    BOOL success = YES;
    NSError *extractError = nil;
    ret = unzGoToFirstFile(zip);
    while (ret == UNZ_OK) {
        NSString *strPath = nil;
        unsigned long long uncompressedSize = 0;
        BOOL isDirectory = NO;
        uLong version = 0;
        uLong externalFa = 0;
        NSString *entryError = nil;
        if (![self readCurrentZipEntry:zip
                                  path:&strPath
                                  size:&uncompressedSize
                           isDirectory:&isDirectory
                               version:&version
                            externalFa:&externalFa
                                 error:&entryError]) {
            success = NO;
            extractError = [NSError errorWithDomain:@"RNZipArchive"
                                               code:-1
                                           userInfo:@{NSLocalizedDescriptionKey: entryError ?: @"failed to retrieve info for zip entry"}];
            break;
        }

        if ([self shouldSkipZipEntry:strPath version:version externalFa:externalFa]) {
            ret = unzGoToNextFile(zip);
            continue;
        }

        if (![self isSafeExtractPath:strPath intoDestination:destinationPath]) {
            success = NO;
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

        [fileManager createDirectoryAtPath:[fullPath stringByDeletingLastPathComponent]
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
            readBytes = unzReadCurrentFile(zip, buffer, sizeof(buffer));
            if (readBytes < 0) {
                success = NO;
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
    } else {
        self.progress = 0.0;
        [self zipArchiveProgressEvent:0 total:1];
        NSString *message = extractError ? extractError.localizedDescription : @"unable to unzip";
        reject(@"unzip_error", message, extractError);
    }
}

- (dispatch_queue_t)methodQueue {
    return dispatch_queue_create("com.mockingbot.ReactNative.ZipArchiveQueue", DISPATCH_QUEUE_SERIAL);
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
