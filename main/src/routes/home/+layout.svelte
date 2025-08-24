<script lang="ts">
  import { page } from "$app/state";

  import { AppHeader } from "@zoron/common/components";
  import type { Tab } from "@zoron/common/types";
  import { zoron } from "@zoron/common/web";

  import {
    faArrowUp,
    faHome,
    faShieldAlt,
    faUser,
    faUserFriends
  } from "@fortawesome/free-solid-svg-icons";

  import { changelog } from "../changelog/changelog";
  import "./home.css";

  // @ts-expect-error its lite duh
  $zoron = {
    schedule: page.data.app?.schedule!,
    constants: {
      timeDelta: page.data.app?.timeDelta!
    }
  };

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  const tabs: Tab[] = [
    { name: "Home", path: "/home?page=home", icon: faHome },
    { name: "Friends", path: "/home/friends", icon: faUserFriends },
    {
      name: "PRO",
      path: "/pro",
      icon: faArrowUp,
      iconClass: "text-yellow-200",
			mobileOnly: true,
    },
    ...(page.data.session?.user?.role === "admin"
      ? [{ name: "Admin", path: "/home/admin", icon: faShieldAlt }]
      : []),
    {
      name: "Account",
      path: "/account",
      icon: page.data.session?.user?.image || faUser,
      mobileOnly: true
    }
  ];
</script>

<AppHeader {tabs} {changelog} isPro={false} headerWidthClass="w-72">
  {@render children?.()}
</AppHeader>
