//
//  RNZipArchive.m
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "RNZipArchive.h"
#import "SSZipArchive/SSZipArchive.h"

@implementation RNZipArchive

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(unzip:(NSString *)zipPath destinationPath:(NSString *)destinationPath)
{
    [SSZipArchive unzipFileAtPath:zipPath
                    toDestination:destinationPath];
}


@end

