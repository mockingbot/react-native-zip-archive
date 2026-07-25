require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'RNZipArchive'
  s.version        = package['version']
  s.summary        = package['description']
  s.author         = package['author']
  s.license        = package['license']
  s.homepage       = 'https://github.com/mockingbot/react-native-zip-archive'
  s.source         = { :git => 'https://github.com/mockingbot/react-native-zip-archive.git', :tag => "#{s.version}"}
  s.platform       = :ios, '15.5'
  s.preserve_paths = '*.js'

  if defined?(install_modules_dependencies) != nil
    install_modules_dependencies(s)
  else
    s.dependency 'React-Core'
  end
  s.dependency 'SSZipArchive', '~>2.5.5'
  s.pod_target_xcconfig = (s.pod_target_xcconfig || {}).merge({
    'HEADER_SEARCH_PATHS' => '$(inherited) "${PODS_ROOT}/SSZipArchive" "${PODS_ROOT}/SSZipArchive/SSZipArchive/minizip" "${PODS_TARGET_SRCROOT}/../SSZipArchive/SSZipArchive/minizip"',
    'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) HAVE_INTTYPES_H HAVE_PKCRYPT HAVE_STDINT_H HAVE_WZAES HAVE_ZLIB ZLIB_COMPAT'
  })

  s.source_files = 'ios/*.{h,m,mm}'
  s.public_header_files = ['ios/RNZipArchive.h']
end
