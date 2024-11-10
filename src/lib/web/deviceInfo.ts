import Fingerprint from "@fingerprintjs/fingerprintjs";

export interface Device {
  fingerprint: string;
  browser: string;
  os: string;
  id: string;
}

const detectBrowser = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Edg") > -1) {
    return "Microsoft Edge";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "Chrome";
  } else if (userAgent.indexOf("Firefox") > -1) {
    return "Firefox";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "Safari";
  } else if (userAgent.indexOf("Opera") > -1) {
    return "Opera";
  } else if (userAgent.indexOf("Trident") > -1 || userAgent.indexOf("MSIE") > -1) {
    return "Internet Explorer";
  }

  return "Unknown";
};

const getOS = (): string => {
  const userAgent = window.navigator.userAgent;
  // @ts-expect-error - TS doesn't know about navigator's userAgentData
  const platform = window.navigator?.userAgentData?.platform || window.navigator.platform;
  const macosPlatforms = ["macOS", "Macintosh", "MacIntel", "MacPPC", "Mac68K"];
  const windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"];
  const iosPlatforms = ["iPhone", "iPad", "iPod"];
  let os: string | null = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = "Mac OS";
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = "iOS";
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = "Windows";
  } else if (/Android/.test(userAgent)) {
    os = "Android";
  } else if (/Linux/.test(platform)) {
    os = "Linux";
  } else {
    os = platform;
  }

  return os!;
};

const generateRandomID = () => Math.random().toString(36).substring(2, 15);

export const getDeviceInfo = async (): Promise<Device> => {
  const browser = detectBrowser();
  const os = getOS();

  let id = localStorage.getItem("visitorId");
  if (!id) {
    id = generateRandomID();
    localStorage.setItem("visitorId", id);
  }

  return { browser, os, fingerprint: (await (await Fingerprint.load()).get()).visitorId, id };
};

export const isIOS = () =>
  (typeof navigator !== "undefined" &&
    ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(
      navigator.platform
    )) ||
  // iPad on iOS 13 detection
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);
