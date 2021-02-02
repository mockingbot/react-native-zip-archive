//  RNZipArchive

#include "pch.h"

#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif
#include "RNZipArchiveModule.h"
#include "NativeModules.h"

namespace winrt::RNZipArchive::implementation
{

void ReactPackageProvider::CreatePackage(const RN::IReactPackageBuilder& packageBuilder) noexcept
{
    AddAttributedModules(packageBuilder);
}

} // namespace winrt::RNZipArchive::implementation
