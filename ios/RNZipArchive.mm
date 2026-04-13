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
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSError *error = nil;

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath preserveAttributes:NO overwrite:YES password:nil error:&error delegate:self];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        reject(@"unzip_error", [error localizedDescription], error);
    }
}

- (void)unzipWithPassword:(NSString *)from
        destinationPath:(NSString *)destinationPath
               password:(NSString *)password
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSError *error = nil;

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath preserveAttributes:NO overwrite:YES password:password error:&error delegate:self];

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

    success = [SSZipArchive createZipFileAtPath:destinationPath withFilesAtPaths:from];

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
    BOOL useAES = encryptionType && ![encryptionType isEqualToString:@"STANDARD"];
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
    // Note: withFilesAtPaths doesn't have AES class method, using password only
    success = [SSZipArchive createZipFileAtPath:destinationPath withFilesAtPaths:from withPassword:password];

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
    // No-op required by TurboModule spec
}

- (void)removeListeners:(double)count {
    // No-op required by TurboModule spec
}

- (dispatch_queue_t)methodQueue {
    return dispatch_queue_create("com.mockingbot.ReactNative.ZipArchiveQueue", DISPATCH_QUEUE_SERIAL);
}

- (void)zipArchiveProgressEvent:(unsigned long long)loaded total:(unsigned long long)total  {
    self.progress = (float)loaded / (float)total;
    [self dispatchProgessEvent:self.progress processedFilePath:self.processedFilePath];
}

- (void)zipArchiveDidUnzipFileAtIndex:(NSInteger)fileIndex totalFiles:(NSInteger)totalFiles archivePath:(NSString *)archivePath unzippedFilePath:(NSString *)processedFilePath {
    self.processedFilePath = processedFilePath;
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
