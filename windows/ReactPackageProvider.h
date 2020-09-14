//  RNZipArchive

#pragma once

#include "ReactPackageProvider.g.h"

namespace RN = winrt::Microsoft::ReactNative;

namespace winrt::RNZipArchive::implementation
{

struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider>
{
    ReactPackageProvider() = default;

    void CreatePackage(const RN::IReactPackageBuilder& packageBuilder) noexcept;
};

} // namespace winrt::RNZipArchive::implementation

namespace winrt::RNZipArchive::factory_implementation
{

struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider, implementation::ReactPackageProvider>
{
};

} // namespace winrt::RNZipArchive::factory_implementation
