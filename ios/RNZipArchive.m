//
//  RNZipArchive.m
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "RNZipArchive.h"

#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>


@implementation RNZipArchive

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(unzip:(NSString *)zipPath
                  destinationPath:(NSString *)destinationPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    
    [self zipArchiveProgressEvent:0 total:1]; // force 0%
    
    BOOL success = [SSZipArchive unzipFileAtPath:zipPath toDestination:destinationPath delegate:self];
    
    [self zipArchiveProgressEvent:1 total:1]; // force 100%
    
    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"unzip_error", @"unable to unzip", error);
    }
}

RCT_EXPORT_METHOD(zip:(NSString *)zipPath
                  destinationPath:(NSString *)destinationPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    
    [self zipArchiveProgressEvent:0 total:1]; // force 0%
    
    BOOL success = [SSZipArchive createZipFileAtPath:destinationPath withContentsOfDirectory:zipPath];
    
    [self zipArchiveProgressEvent:1 total:1]; // force 100%
    
    if (success) {
        resolve(destinationPath);
    } else {
        NSError *error = nil;
        reject(@"zip_error", @"unable to zip", error);
    }
}

- (void)zipArchiveProgressEvent:(NSInteger)loaded total:(NSInteger)total {
    if (total == 0) {
        return;
    }
    
    // TODO: should send the filename, just like the Android version
    [self.bridge.eventDispatcher sendAppEventWithName:@"zipArchiveProgressEvent" body:@{
                                                                                        @"progress": @( (float)loaded / (float)total )
                                                                                        }];
}

@end
