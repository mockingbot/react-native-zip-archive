//  RNZipArchive

#include "pch.h"

#include "RNZipArchiveModule.h"

#include "miniz.h"
#include "miniz_zip.h"

#include <filesystem>
#include <winrt/Windows.Storage.h>

using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Foundation::Collections;
using namespace winrt::Windows::System;
using namespace winrt::Windows::System::Threading;

void RNZipArchiveModule::isPasswordProtected(
    std::string zipFilePath, winrt::Microsoft::ReactNative::ReactPromise<bool> promise) noexcept
{
    promise.Reject("Not Yet Implemented: isPasswordProtected");
}

winrt::fire_and_forget RNZipArchiveModule::unzip(
    std::string zipFilePath,
    std::string destinationDirectory,
    std::string,
    winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept
try
{
    co_await ThreadPool::RunAsync(WorkItemHandler([zipFilePath, destinationDirectory](IAsyncAction operation) {
        mz_zip_archive archive = {};

        if (operation.Status() != AsyncStatus::Started)
        {
            // already cancelled or otherwise doesn't need to run so bail out before doing a bunch of work
            return;
        }

        try
        {
            if (MZ_TRUE != mz_zip_reader_init_file(&archive, zipFilePath.c_str(), 0))
            {
                throw std::invalid_argument(mz_zip_get_error_string(mz_zip_get_last_error(&archive)));
            }

            auto destinationPath = std::filesystem::path(destinationDirectory);
            destinationPath.make_preferred();

            // For whatever reason, UWPs can't make use of current_path so instead
            // use the app's data folder as the "pwd" for any paths.
            // This will then nicely handle canonicalization of both relative and absolute destination folders.
            auto appDataRootFolder = winrt::Windows::Storage::ApplicationData::Current().LocalFolder();
            auto appDataRootFolderPath = std::filesystem::path(winrt::to_string(appDataRootFolder.Path()));

            auto destinationPathTemp = destinationPath;
            destinationPathTemp += appDataRootFolderPath;

            std::filesystem::path canonicalDestinationPath = std::filesystem::canonical(destinationPathTemp);

            for (mz_uint i = 0; i < mz_zip_reader_get_num_files(&archive); i++)
            {
                if (MZ_TRUE != mz_zip_reader_is_file_a_directory(&archive, i))
                {
                    mz_uint filenameSizeBytes = mz_zip_reader_get_filename(&archive, i, nullptr, 0);
                    if (0 == filenameSizeBytes)
                    {
                        throw std::invalid_argument(mz_zip_get_error_string(mz_zip_get_last_error(&archive)));
                    }

                    std::string filename;
                    filename.resize(filenameSizeBytes);

                    if (0 ==
                        mz_zip_reader_get_filename(&archive, i, filename.data(), static_cast<mz_uint>(filename.size())))
                    {
                        throw std::invalid_argument(mz_zip_get_error_string(mz_zip_get_last_error(&archive)));
                    }

                    auto fullDestinationPath = canonicalDestinationPath;
                    fullDestinationPath /= filename;
                    fullDestinationPath.make_preferred();

                    auto fullDestinationPathTemp = fullDestinationPath;
                    fullDestinationPathTemp += appDataRootFolderPath;
                    std::filesystem::path canonicalFullDestinationPath =
                        std::filesystem::canonical(fullDestinationPathTemp);

                    if (0 != canonicalFullDestinationPath.u8string().find(canonicalDestinationPath.u8string()))
                    {
                        // This is a path traversal attack. Abort mission.
                        throw std::filesystem::filesystem_error(
                            "Invalid path traversal from destination root",
                            canonicalDestinationPath,
                            canonicalFullDestinationPath,
                            std::error_code());
                    }

                    if (canonicalFullDestinationPath.has_parent_path())
                    {
                        std::filesystem::create_directories(canonicalFullDestinationPath.parent_path());
                    }

                    if (0 ==
                        mz_zip_reader_extract_to_file(&archive, i, canonicalFullDestinationPath.u8string().c_str(), 0))
                    {
                        throw std::invalid_argument(mz_zip_get_error_string(mz_zip_get_last_error(&archive)));
                    }
                }
            }

            mz_zip_reader_end(&archive);
        }
        catch (...)
        {
            mz_zip_reader_end(&archive);
            std::rethrow_exception(std::current_exception());
        }
    }));
    promise.Resolve("");
    co_return;
}
catch (...)
{
    promise.Reject("Cannot unzip file");
}

void RNZipArchiveModule::unzipWithPassword(
    std::string zipFilePath,
    std::string destDirectory,
    std::string password,
    winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept
{
    // TODO as needed
    promise.Reject("Not Yet Implemented: unzipWithPassword");
}

void RNZipArchiveModule::zipFiles(
    std::vector<std::string> files,
    std::string destDirectory,
    winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept
{
    // TODO as needed
    promise.Reject("Not Yet Implemented: zipFiles");
}

void RNZipArchiveModule::zipFolder(
    std::string folder, std::string destFile, winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept
{
    // TODO as needed
    promise.Reject("Not Yet Implemented: zipFolder");
}

void RNZipArchiveModule::zipFilesWithPassword(
    std::vector<std::string> files,
    std::string destFile,
    std::string password,
    std::string encryptionMethod,
    winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept
{
    // TODO as needed
    promise.Reject("Not Yet Implemented: zipFilesWithPassword");
}

void RNZipArchiveModule::zipFolderWithPassword(
    std::string folder,
    std::string destFile,
    std::string password,
    std::string encryptionMethod,
    winrt::Microsoft::ReactNative::ReactPromise<std::string> promise) noexcept
{
    // TODO as needed
    promise.Reject("Not Yet Implemented: zipFolderWithPassword");
}

