//
//  RNZipArchive.m
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "RNZipArchive.h"

#if __has_include(<React/RCTEventDispatcher.h>)
#import <React/RCTEventDispatcher.h>
#else
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#endif

@implementation RNZipArchive

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

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
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSError *error = nil;

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath overwrite:YES password:nil error:&error delegate:self];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        reject(@"unzip_error", [error localizedDescription], error);
    }
}

RCT_EXPORT_METHOD(unzipWithPassword:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSError *error = nil;

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath overwrite:YES password:password error:&error delegate:self];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        reject(@"unzip_error", @"unable to unzip", error);
    }
}

RCT_EXPORT_METHOD(zip:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];
    success = [SSZipArchive createZipFileAtPath:destinationPath withContentsOfDirectory:from keepParentDirectory:NO withPassword:nil andProgressHandler:self.progressHandler];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"zip_error", @"unable to zip", error);
    }
}


RCT_EXPORT_METHOD(zipWithPassword:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  password:(NSString *)password
                  encryptionType:(NSString *)encryptionType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.progress = 0.0;
    self.processedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success;
    [self setProgressHandler];
    success = [SSZipArchive createZipFileAtPath:destinationPath withContentsOfDirectory:from keepParentDirectory:NO withPassword:password andProgressHandler:self.progressHandler];

    self.progress = 1.0;
    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"zip_error", @"unable to zip", error);
    }
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
    [self sendEventWithName:@"zipArchiveProgressEvent" body:@{@"progress": @(progress), @"filePath": processedFilePath}];
}

@end
