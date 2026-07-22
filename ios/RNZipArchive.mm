//
//  RNZipArchive.mm
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "RNZipArchive.h"
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

- (void)isPasswordProtected:(NSString *)file
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    BOOL isPasswordProtected = [SSZipArchive isFilePasswordProtectedAtPath:file];
    resolve([NSNumber numberWithBool:isPasswordProtected]);
}

- (void)unzip:(NSString *)from
destinationPath:(NSString *)destinationPath
      charset:(NSString *)charset
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject {
    [self unzipFile:from destinationPath:destinationPath password:nil resolve:resolve reject:reject];
}

- (void)unzipWithPassword:(NSString *)from
        destinationPath:(NSString *)destinationPath
               password:(NSString *)password
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
    [self unzipFile:from destinationPath:destinationPath password:password resolve:resolve reject:reject];
}

- (void)unzipFile:(NSString *)from
destinationPath:(NSString *)destinationPath
      password:(NSString *)password
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject {
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

    BOOL success = [SSZipArchive unzipFileAtPath:from
                                  toDestination:destinationPath
                             preserveAttributes:NO
                                      overwrite:YES
                                 nestedZipLevel:0
                                       password:password
                                          error:&error
                                       delegate:nil
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

    if (success) {
        resolve(destinationPath);
    } else {
        NSString *errorMessage = error ? [error localizedDescription] : @"unable to unzip";
        reject(@"unzip_error", errorMessage, error);
    }
}

- (void)zipFolder:(NSString *)from
  destinationPath:(NSString *)destinationPath
 compressionLevel:(double)compressionLevel
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

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
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"zip_error", @"unable to zip", error);
    }
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
            success &= [zipArchive writeFileAtPath:entry[0] withFileName:entry[1] compressionLevel:compressionLevel password:password AES:aes];
            if (self.progressHandler) {
                complete++;
                self.progressHandler(complete, total);
            }
        }
        success &= [zipArchive close];
    }
    return success;
}

- (void)zipFiles:(NSArray<NSString *> *)from
 destinationPath:(NSString *)destinationPath
compressionLevel:(double)compressionLevel
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];

    success = [self writeZipEntriesToPath:destinationPath paths:from compressionLevel:Z_DEFAULT_COMPRESSION password:nil AES:NO];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"zip_error", @"unable to zip", error);
    }
}

- (void)zipFolderWithPassword:(NSString *)from
              destinationPath:(NSString *)destinationPath
                     password:(NSString *)password
               encryptionType:(NSString *)encryptionType
             compressionLevel:(double)compressionLevel
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];
    BOOL useAES = encryptionType && [encryptionType length] > 0 && ![encryptionType isEqualToString:@"STANDARD"];
    success = [SSZipArchive createZipFileAtPath:destinationPath
                        withContentsOfDirectory:from
                            keepParentDirectory:NO
                               compressionLevel:compressionLevel
                                       password:password
                                            AES:useAES
                                progressHandler:self.progressHandler];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"zip_error", @"unable to zip", error);
    }
}

- (void)zipFilesWithPassword:(NSArray<NSString *> *)from
             destinationPath:(NSString *)destinationPath
                    password:(NSString *)password
              encryptionType:(NSString *)encryptionType
            compressionLevel:(double)compressionLevel
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];
    // Note: entries are written with AES:YES, matching the previous behavior of
    // createZipFileAtPath:withFilesAtPaths: (which routes through AES:YES writes)
    success = [self writeZipEntriesToPath:destinationPath paths:from compressionLevel:Z_DEFAULT_COMPRESSION password:password AES:YES];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"zip_error", @"unable to zip", error);
    }
}

- (void)getUncompressedSize:(NSString *)path
                    charset:(NSString *)charset
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    NSError *error = nil;
    NSNumber *wantedFileSize = [SSZipArchive payloadSizeForArchiveAtPath:path error:&error];

    if (error == nil) {
        resolve(wantedFileSize);
    } else {
        resolve(@-1);
    }
}

- (void)unzipAssets:(NSString *)source
             target:(NSString *)target
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
    // iOS doesn't have assets like Android, return error
    NSError *error = [NSError errorWithDomain:@"RNZipArchive" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"unzipAssets is not supported on iOS"}];
    reject(@"unzip_assets_not_supported", @"unzipAssets is not supported on iOS", error);
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
