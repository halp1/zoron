import Fingerprint from "@fingerprintjs/fingerprintjs";

export interface Device {
  fingerprint: string;
  browser: string;
  os: string;
  id: string;
}

const generateRandomID = () => Math.random().toString(36).substring(2, 15);

export const getDeviceInfo = async (): Promise<Device> => {
  const userAgent = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  // Detect browser
  if (userAgent.indexOf("Firefox") > -1) {
    browser = "Firefox";
  } else if (userAgent.indexOf("Chrome") > -1) {
    browser = "Chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    browser = "Safari";
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) {
    browser = "Internet Explorer";
  }

  // Detect OS
  if (userAgent.indexOf("Win") > -1) {
    os = "Windows";
  } else if (userAgent.indexOf("Mac") > -1) {
    os = "MacOS";
  } else if (userAgent.indexOf("Linux") > -1) {
    os = "Linux";
  } else if (userAgent.indexOf("Android") > -1) {
    os = "Android";
  } else if (userAgent.indexOf("like Mac") > -1) {
    os = "iOS";
  }

  let id = localStorage.getItem("visitorId");
  if (!id) {
    id = generateRandomID();
    localStorage.setItem("visitorId", id);
  }

  return { browser, os, fingerprint: (await (await Fingerprint.load()).get()).visitorId, id };
};
