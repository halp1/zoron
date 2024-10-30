<script lang="ts">
  import { Footer } from "$lib/components";
  import {} from "@fortawesome/free-brands-svg-icons";
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
    <div class="flex flex-col items-center justify-center gap-3 rounded-3xl bg-slate-800 p-6">
      <div class="text-center text-2xl">Check your email</div>
      <div class="text-center text-base">
        We've sent a verification link to your email. Click the link to verify your account.
      </div>
      <div class="text-center text-base">
        Having trouble signing in with email on the app? Add a password to your account on the
        website, then use that to sign in <a href="/login" class="underline">here</a>.
      </div>
      <div class="relative flex items-center justify-center gap-3">
        <a href="/home" class="btn-full btn-outlined border-green-400 text-base">I'm logged in</a>
        <div class="h-8 w-1 bg-slate-600"></div>
        <div class="flex items-center gap-2">
          {#each mailButtons as { title, url, icon }}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              class="btn-circle bg-slate-700 hover:bg-slate-600"
              {title}
            >
              <img src={icon} alt={title} class="h-6 w-6" />
            </a>
          {/each}
        </div>
      </div>
    </div>
  </main>
  <Footer />
</div>
