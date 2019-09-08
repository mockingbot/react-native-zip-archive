using ICSharpCode.SharpZipLib.Core;
using ICSharpCode.SharpZipLib.Zip;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using System;
using System.IO;
using System.Text;

namespace RNZipArchive
{
    /// <summary>
    /// A module that allows JS to share data.
    /// </summary>
    class RNZipArchiveModule : NativeModuleBase
    {
        private RCTNativeAppEventEmitter _emitter;

        internal RCTNativeAppEventEmitter Emitter
        {
            get
            {
                if (_emitter == null)
                {
                    return Context.GetJavaScriptModule<RCTNativeAppEventEmitter>();
                }

                return _emitter;
            }
            set
            {
                _emitter = value;
            }
        }

        internal ReactContext Context;

        /// <summary>
        /// Instantiates the <see cref="RNZipArchiveModule"/>.
        /// </summary>
        internal RNZipArchiveModule(ReactContext reactContext)
        {
            Context = reactContext;
        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RNZipArchive";
            }
        }

        [ReactMethod]
        public void unzip(string source, string target, string charset, JObject options, IPromise promise)
        {
            try
            {
                bool IsUnicodeText = charset.ToUpper().Contains("UTF") || charset.ToUpper() == "UNICODE" || charset.Length < 1;
                if (!IsUnicodeText)
                {
#pragma warning disable CS0618 // Тип или член устарел
                    ZipConstants.DefaultCodePage = Encoding.GetEncoding(charset).CodePage;
#pragma warning restore CS0618 // Тип или член устарел
                } else
                {
#pragma warning disable CS0618 // Тип или член устарел
                    ZipConstants.DefaultCodePage = Encoding.UTF8.CodePage;
#pragma warning restore CS0618 // Тип или член устарел
                }
                FastZipEvents events = new FastZipEvents();
                events.Progress = ProcessMethod;
                FastZip fastZip = new FastZip(events);
                fastZip.EntryFactory = new ZipEntryFactory
                {
                    IsUnicodeText = IsUnicodeText
                };
                fastZip.ExtractZip(source, target, null);
                promise.Resolve(target);
            }
            catch (Exception ex)
            {
                Reject(promise, source, ex);
            }
        }

        [ReactMethod]
        public void unzipWithPassword(string source, string target, string password, JObject options, IPromise promise)
        {
            try
            {
#pragma warning disable CS0618 // Тип или член устарел
                ZipConstants.DefaultCodePage = Encoding.UTF8.CodePage;
#pragma warning restore CS0618 // Тип или член устарел
                FastZipEvents events = new FastZipEvents();
                events.Progress = ProcessMethod;
                FastZip fastZip = new FastZip(events);
                fastZip.EntryFactory = new ZipEntryFactory
                {
                    IsUnicodeText = true
                };
                fastZip.Password = password;
                fastZip.ExtractZip(source, target, null);
                promise.Resolve(target);
            }
            catch (Exception ex)
            {
                Reject(promise, source, ex);
            }
        }

        [ReactMethod]
        public void zip(string source, string target, JObject options, IPromise promise)
        {
            try
            {
#pragma warning disable CS0618 // Тип или член устарел
                ZipConstants.DefaultCodePage = Encoding.UTF8.CodePage;
#pragma warning restore CS0618 // Тип или член устарел
                FastZipEvents events = new FastZipEvents();
                events.Progress = ProcessMethod;
                FastZip fastZip = new FastZip(events);
                fastZip.EntryFactory = new ZipEntryFactory
                {
                    IsUnicodeText = true
                };
                fastZip.CreateZip(target, source, true, null);
                promise.Resolve(target);
            }
            catch (Exception ex)
            {
                Reject(promise, source, ex);
            }
        }

        [ReactMethod]
        public void zipWithPassword(string source, string target, string password, string encryptionMethod, JObject options, IPromise promise)
        {
            try
            {
#pragma warning disable CS0618 // Тип или член устарел
                ZipConstants.DefaultCodePage = Encoding.UTF8.CodePage;
#pragma warning restore CS0618 // Тип или член устарел
                FastZipEvents events = new FastZipEvents();
                events.Progress = ProcessMethod;
                FastZip fastZip = new FastZip(events);
                fastZip.EntryFactory = new ZipEntryFactory
                {
                    IsUnicodeText = true
                };
                fastZip.Password = password;
                fastZip.CreateZip(target, source, true, null);
                promise.Resolve(target);
            }
            catch (Exception ex)
            {
                Reject(promise, source, ex);
            }
        }

        [ReactMethod]
        public void isPasswordProtected(string source, JObject options, IPromise promise)
        {
            try
            {
                promise.Resolve(IsPasswordProtectedZipFile(source));
            }
            catch (Exception ex)
            {
                Reject(promise, source, ex);
            }
        }

        private static bool IsPasswordProtectedZipFile(string path)
        {
            using (FileStream fileStreamIn = new FileStream(path, FileMode.Open, FileAccess.Read))
            using (ZipInputStream zipInStream = new ZipInputStream(fileStreamIn))
            {
                ZipEntry entry = zipInStream.GetNextEntry();
                return entry.IsCrypted;
            }
        }

        private void ProcessMethod(object sender, ProgressEventArgs args)
        {
            SendEvent("zipArchiveProgressEvent", new JObject
            {
                { "progress", args.PercentComplete },
                { "filePath", args.Name },
            });
        }

        private void SendEvent(string eventName, JObject eventData)
        {
            Emitter.emit(eventName, eventData);
        }

        private void Reject(IPromise promise, String filepath, Exception ex)
        {
            if (ex is FileNotFoundException)
            {
                RejectFileNotFound(promise, filepath);
                return;
            }

            promise.Reject(ex);
        }

        private void RejectFileNotFound(IPromise promise, String filepath)
        {
            promise.Reject("ENOENT", "ENOENT: no such file or directory, open '" + filepath + "'");
        }
    }
}
