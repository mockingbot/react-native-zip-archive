//  RNZipArchive

#pragma once
#include "NativeModules.h"

#include <functional>

REACT_MODULE(RNZipArchiveModule, L"RNZipArchive");
struct RNZipArchiveModule
{
    RNZipArchiveModule() = default;
    ~RNZipArchiveModule() = default;

    // Module implementation

    REACT_METHOD(isPasswordProtected);
    void isPasswordProtected(
        std::string zipFilePath, winrt::Microsoft::ReactNative::ReactPromise<bool> promise) noexcept;

    REACT_METHOD(unzip);
    winrt::fire_and_forget unzip(
        std::string zipFilePath,
        std::string destDirectory,
        std::string charset,
        winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept;

    REACT_METHOD(unzipWithPassword);
    void unzipWithPassword(
        std::string zipFilePath,
        std::string destDirectory,
        std::string password,
        winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept;

    REACT_METHOD(zipFiles);
    void zipFiles(
        std::vector<std::string> files,
        std::string destDirectory,
        winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept;

    REACT_METHOD(zipFolder);
    void zipFolder(
        std::string folder,
        std::string destFile,
        winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept;

    REACT_METHOD(zipFilesWithPassword);
    void zipFilesWithPassword(
        std::vector<std::string> files,
        std::string destFile,
        std::string password,
        std::string encryptionMethod,
        winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept;

    REACT_METHOD(zipFolderWithPassword);
    void zipFolderWithPassword(
        std::string folder,
        std::string destFile,
        std::string password,
        std::string encryptionMethod,
        winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept;

};