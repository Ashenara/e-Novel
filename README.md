# Hugo Theme e-Novel / e-Book / e-Reading
- Demo this theme [www.arashe.com](https://www.arashe.com)
- Demo phase 2 [www.ashenara.com](https://www.ashenara.com)

## Features
- Showcase for novel and book,
- Reading fiture with good tools,
- Blogging,
- Responsive,
- Tailwindcss,
- Login fiture,
- Darklight mode,
- Easy to customize,
- Search modal,
- etc.

#### Need attention
- This theme using Firebase database and authentication for login, comments also though, you just need to fill firebase data in hugo.toml.

- For settings, you can see ex-hugo.toml for ref,

- Novel page: Download and read in same button, if for read online, keep frontmater `download: ""` like this or just remove it.

-  Novel author using params writer.

#### Notes
- I'm not pro on coding, so this theme is a bit mess. Anyway i already test it on netlify a few weeks and work well.

- The big problem maybe in seo, i try @schema.org but failed so i just use general seo.

## Installation

#### Git Submodule
    git submodule add https://github.com/Ashenara/e-Novel.git themes/e-Novel

    git submodule update --init --recursive
    
#### Update Submodule
    git submodule update --remote --merge
    
## Usage for localhost
Install dependencies, 
Hugo Guide: 
- [Hugo-Tailwincss](https://gohugo.io/functions/css/tailwindcss/)
- [Tailwindcss Typography](https://github.com/tailwindlabs/tailwindcss-typography)
- [Hugo Sass](https://gohugo.io/functions/css/sass/)

#### Dependencies
    npm install --save-dev tailwindcss @tailwindcss/cli

    npm install -D @tailwindcss/typography

    brew install sass/sass/sass

## Settings

#### For deploy or localhost you need add tailwindcss setting in hugo.toml
    # Taiwind CSS settings - must have in hugo.toml root
    [build]
        [build.buildStats]
        enable = true
    [[build.cachebusters]]
        source = 'assets/notwatching/hugo_stats\.json'
        target = 'css'
    [[build.cachebusters]]
        source = '(postcss|tailwind)\\.config\\.js'
        target = 'css'
    [module]
        [[module.mounts]]
        source = 'assets'
        target = 'assets'
    [[module.mounts]]
        disableWatch = true
        source = 'hugo_stats.json'
        target = 'assets/notwatching/hugo_stats.json'
    

#### Settings you need add for this theme work well
    # Markup settings
    [markup]
        [markup.goldmark]
            [markup.goldmark.renderer]
            unsafe = true

    # Search settings
    [outputs]
        home = ["HTML", "RSS", "search"]

    [outputFormats]
        [outputFormats.search]
        mediaType = "application/json"
        baseName = "search"
        isPlainText = true

## Credits
@hugo-narrow - https://github.com/tom2almighty/hugo-narrow
- prose, chroma, and codeblock style

@admonition - https://github.com/KKKZOZ/hugo-admonitions
- admonition style