# Setup

This is written for someone who has never run these tools before. Every command
goes on its own line. Type it exactly as shown, press enter, and read what it says
before moving to the next line.

Open the Terminal app and navigate to this folder before you start:

```bash
cd ~/hitting-plus
```

(If you cloned or copied this project somewhere else, use that path instead.)

---

## 1. One-time setup

This project uses **Bun** instead of `npm`. It is a single program that installs
packages and runs the app, and it is faster than the alternatives. If you already
have `npm` installed and prefer it, every command below also works with `npm`
in place of `bun` (for example `npm install` instead of `bun install`, `npm run
dev` instead of `bun run dev`). In that case, skip to step 2.

Check whether you already have Bun:

```bash
bun --version
```

If that prints a version number, skip to the next command. If it says
"command not found," install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

Close the Terminal window and open a new one so the `bun` command is available,
then confirm:

```bash
bun --version
```

You should see a version number like `1.3.10`.

Now install the project's dependencies. Run this once, and again any time you
pull down changes that touch `package.json`:

```bash
bun install
```

You should see a line ending in something like `X packages installed`.

---

## 2. Running it locally

```bash
bun run dev
```

You should see:

```
Ready in ...ms
- Local: http://localhost:3000
```

Open that address in your browser. You should see the Hitting+ Explorer with a
player card loaded. Leave this Terminal window open while you work; press
`Ctrl+C` in it to stop the server when you are done.

---

## 3. Deploying to Vercel

This only needs to be done once, the first time you put the app online.

1. Create a free account at [vercel.com](https://vercel.com) if you do not have
   one, and sign in.
2. Push this project to a GitHub repository (create a new, empty repository on
   [github.com/new](https://github.com/new) first, then run the three commands
   GitHub shows you under "push an existing repository from the command line").
3. In the Vercel dashboard, click **Add New... > Project**, choose **Import Git
   Repository**, and select the repository you just pushed.
4. Leave every setting on its default (Vercel detects Next.js automatically) and
   click **Deploy**.

After a minute or two you get a live URL like `hitting-plus.vercel.app`. From then
on, every time you push a change to the `main` branch on GitHub, Vercel rebuilds
and redeploys automatically. You do not need to repeat these four steps.

---

## 4. Updating the data

This is the part you will do repeatedly. When your Python engine produces a new
`swingplus_latest.json`:

```bash
cp /path/to/your/new/swingplus_latest.json public/data/swingplus_latest.json
```

(Replace `/path/to/your/new/` with wherever your Python engine writes the file.)

Check that the app still builds cleanly with the new data:

```bash
bun run build
```

You should see `Compiled successfully` and no red error text. If you see errors
mentioning a specific field or file, the new data does not match what the app
expects. Stop here and check the file rather than pushing it.

Commit and push the new data file:

```bash
git add public/data/swingplus_latest.json
git commit -m "Update data"
git push
```

Vercel picks up the push automatically and redeploys within a minute or two. You
can watch the deployment progress on your project's page at vercel.com.

---

## Troubleshooting

- **`bun: command not found`**: close and reopen Terminal after installing Bun
  (step 1), or restart your computer if that does not fix it.
- **`bun run build` fails after updating data**: the new JSON file does not have
  the fields or shape the app expects. Compare it against
  `public/data/swingplus_latest.json` from before your change, or check the data
  contract described in `CLAUDE_CODE_BRIEF.md`.
- **The site on Vercel did not update after you pushed**: check the
  **Deployments** tab on your Vercel project page. If a deployment shows a red
  error, click into it to read the build log; it is usually the same error
  `bun run build` would show locally.
