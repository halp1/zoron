<script lang="ts">
  import { page } from "$app/state";

  import { AppHeader } from "@zoron/common/components";
  import type { Tab } from "@zoron/common/types";

  import {
    faCalendar,
    faChartLine,
    faHome,
    faList,
    faShieldAlt,
    faUser,
    faUserFriends
  } from "@fortawesome/free-solid-svg-icons";

  import { changelog } from "../changelog/changelog";
  import "./home.css";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  const tabs: Tab[] = [
    { name: "Home", path: "/home?page=home", icon: faHome },
    { name: "Schedule", path: "/home/schedule", icon: faCalendar },
    { name: "Grades", path: "/home/grades", icon: faChartLine },
    { name: "Activity", path: "/home/activity", icon: faList },
    { name: "Friends", path: "/home/friends", icon: faUserFriends },
    // { name: "Chat", path: "/home/chat", icon: faComments },
    ...(page.data.session?.user?.role === "admin"
      ? [{ name: "Admin", path: "/home/admin", icon: faShieldAlt }]
      : []),
    {
      name: "Account",
      path: "/account",
      icon: page.data.session?.user?.image ?? faUser,
      mobileOnly: true
    }
  ];
</script>

<AppHeader
  {tabs}
  {changelog}
  isPro={true}
  headerWidthClass="w-60"
>
  {@render children?.()}
</AppHeader>
