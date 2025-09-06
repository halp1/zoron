import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export interface Tab {
  name: string;
  path: string;
  icon: IconDefinition | string;
  target?: "mobile" | "desktop" | "all";
  iconClass?: string;
}

export interface Changelog {
  version: string;
  [key: string]: any;
}

export interface AppHeaderProps {
  tabs: Tab[];
  changelog: Changelog[];
  isPro?: boolean;
  headerWidthClass?: string;
  contentPaddingClass?: string;
}
