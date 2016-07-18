require 'json'
pjson = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|

  s.name            = "RNZipArchive"
  s.version         = pjson["version"]
  s.homepage        = "https://github.com/plrthink/react-native-zip-archive"
  s.summary         = pjson["description"]
  s.license         = pjson["license"]
  s.author          = { "zimo" => "zimo-go@163.com" }
  s.platform        = :ios, "7.0"
  s.source          = { :git => "https://github.com/plrthink/react-native-zip-archive", :tag => "#{s.version}" }
  s.source_files    = '**/*.{h,m,c}'
  s.preserve_paths  = "**/*.js"

  s.dependency 'React/Core'

end
