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
@synthesize unzipProgress;
@synthesize unzippedFilePath;

RCT_EXPORT_MODULE();

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
    self.unzipProgress = 0.0;
    self.unzippedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSError *error = nil;

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath overwrite:YES password:nil error:&error delegate:self];

    self.unzipProgress = 1.0;
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
    self.unzipProgress = 0.0;
    self.unzippedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSError *error = nil;

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath overwrite:YES password:password error:&error delegate:self];

    self.unzipProgress = 1.0;
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
    self.unzipProgress = 0.0;
    self.unzippedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSFileManager *fileManager = [[NSFileManager alloc] init];
    BOOL isDir;
    BOOL success;
    [fileManager fileExistsAtPath:from isDirectory:&isDir];
    if (isDir) {
        success = [SSZipArchive createZipFileAtPath:destinationPath withContentsOfDirectory:from];
    } else {
        success = [SSZipArchive createZipFileAtPath:destinationPath withFilesAtPaths:@[from]];
    }

    self.unzipProgress = 1.0;
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
    self.unzipProgress = 0.0;
    self.unzippedFilePath = @"";
    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    NSFileManager *fileManager = [[NSFileManager alloc] init];
    BOOL isDir;
    BOOL success;
    [fileManager fileExistsAtPath:from isDirectory:&isDir];
    if (isDir) {
        success = [SSZipArchive createZipFileAtPath:destinationPath withContentsOfDirectory:from withPassword:password];
    } else {
        success = [SSZipArchive createZipFileAtPath:destinationPath withFilesAtPaths:@[from] withPassword:password];
    }

    self.unzipProgress = 1.0;
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
    self.unzipProgress = (float)loaded / (float)total;
    [self dispatchProgessEvent:self.unzipProgress unzippedFilePath:self.unzippedFilePath];
}

- (void)zipArchiveDidUnzipFileAtIndex:(NSInteger)fileIndex totalFiles:(NSInteger)totalFiles archivePath:(NSString *)archivePath unzippedFilePath:(NSString *)unzippedFilePath {
    self.unzippedFilePath = unzippedFilePath;
    [self dispatchProgessEvent:self.unzipProgress unzippedFilePath:self.unzippedFilePath];
}

- (void)dispatchProgessEvent:(float)progress unzippedFilePath:(NSString *)unzippedFilePath {
    [self.bridge.eventDispatcher sendAppEventWithName:@"zipArchiveProgressEvent" body:@{
                                                                                        @"progress": @(progress),
                                                                                        @"filePath": unzippedFilePath
                                                                                        }];
}

@end
