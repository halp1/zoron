<script lang="ts">
  import { Footer } from "@zoron/common/components";
  import { theme } from "@zoron/common/web";

  const mailButtons = [
    {
      title: "Gmail",
      url: "https://mail.google.com",
      icon: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
    },
    {
      title: "Outlook",
      url: "https://outlook.live.com",
      icon: "https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
    },
    {
      title: "ProtonMail",
      url: "https://mail.protonmail.com",
      icon: "https://vectorwiki.com/images/7GjPc__proton-mail.svg"
    }
  ];
</script>

<div class="flex h-screen flex-col">
  <main class="flex w-full flex-1 items-center justify-center px-3">
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-3xl {$theme ===
      'amoled'
        ? 'border-2 border-white bg-black'
        : 'bg-slate-800'} p-6"
    >
      <div class="text-center text-2xl">Check your email</div>
      <div class="text-center text-base">
        We've sent a verification link to your email. Click the link to access
        your account.
      </div>
      <div class="relative flex items-center justify-center gap-3">
        <a
          href="/home"
          class="btn-full btn-outlined {$theme === 'amoled'
            ? 'border-white'
            : 'border-green-400'} text-base">I'm logged in</a
        >
        <div
          class="{$theme === 'amoled' ? 'bg-white' : 'bg-slate-600'} h-8 w-1"
        ></div>
        <div class="flex items-center gap-2">
          {#each mailButtons as { title, url, icon }}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              class="btn-circle {$theme === 'amoled'
                ? 'border border-white bg-gray-900 hover:bg-gray-800'
                : 'bg-slate-700 hover:bg-slate-600'}"
              {title}
            >
              <img src={icon} alt={title} class="h-6 w-6" />
            </a>
          {/each}
        </div>
      </div>
      <div class={$theme === "amoled" ? "text-white" : "text-slate-400"}>
        If you can't find the email, check your spam folder and report the email
        as not spam.<br />
        Make sure to open the link in this browser, which might require copying and
        pasting the link into the browser.
      </div>
    </div>
  </main>
  <Footer />
</div>
