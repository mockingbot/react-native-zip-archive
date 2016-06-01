//
//  RNZipArchive.m
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "RNZipArchive.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@implementation RNZipArchive

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(unzip:(NSString *)zipPath destinationPath:(NSString *)destinationPath callback:(RCTResponseSenderBlock)callback) {

    [self zipArchiveProgressEvent:0 total:1]; // force 0%

    BOOL success = [SSZipArchive unzipFileAtPath:zipPath toDestination:destinationPath delegate:self];

    [self zipArchiveProgressEvent:1 total:1]; // force 100%

    if (success) {
        callback(@[[NSNull null]]);
    } else {
        callback(@[@"unzip error"]);
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
