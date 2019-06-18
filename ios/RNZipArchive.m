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

RCT_EXPORT_METHOD(isPasswordProtected:(NSString *)file
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    BOOL isPasswordProtected = [SSZipArchive isFilePasswordProtectedAtPath:file];
    resolve([NSNumber numberWithBool:isPasswordProtected]);
}

RCT_EXPORT_METHOD(unzip:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    [self zipArchiveProgressEvent:0 total:1 filePath:from]; // force 0%

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath overwrite:YES password:nil error:nil delegate:self];

    [self zipArchiveProgressEvent:1 total:1 filePath:from]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"unzip_error", @"unable to unzip", error);
    }
}

RCT_EXPORT_METHOD(unzipWithPassword:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    [self zipArchiveProgressEvent:0 total:1 filePath:from]; // force 0%

    BOOL success = [SSZipArchive unzipFileAtPath:from toDestination:destinationPath overwrite:YES password:password error:nil delegate:self];

    [self zipArchiveProgressEvent:1 total:1 filePath:from]; // force 100%

    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"unzip_error", @"unable to unzip", error);
    }
}

RCT_EXPORT_METHOD(zip:(NSString *)from
                  destinationPath:(NSString *)destinationPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    [self zipArchiveProgressEvent:0 total:1 filePath:destinationPath]; // force 0%

    NSFileManager *fileManager = [[NSFileManager alloc] init];
    BOOL isDir;
    BOOL success;
    [fileManager fileExistsAtPath:from isDirectory:&isDir];
    if (isDir) {
        success = [SSZipArchive createZipFileAtPath:destinationPath withContentsOfDirectory:from];
    } else {
        success = [SSZipArchive createZipFileAtPath:destinationPath withFilesAtPaths:@[from]];
    }

    [self zipArchiveProgressEvent:1 total:1 filePath:destinationPath]; // force 100%

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

- (void)zipArchiveProgressEvent:(unsigned long long)loaded total:(unsigned long long)total filePath:(NSString *)filePath {
    [self.bridge.eventDispatcher sendAppEventWithName:@"zipArchiveProgressEvent" body:@{
                                                                                        @"progress": @((float)loaded / (float)total),
                                                                                        @"filePath": filePath
                                                                                        }];
}

@end
