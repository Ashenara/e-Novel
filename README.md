# Hugo Theme e-Novel / e-Book / e-Reading
- Demo this theme [www.arashe.com](https://www.arashe.com)

- Development site [www.ashenara.com](https://www.ashenara.com)

## Features
- Showcase for novel and book,
- Reading fiture with good tools,
- Blogging,
- Responsive,
- Tailwindcss,
- Darklight mode,
- Easy to customize,
- Search modal,
- Firebase integration,
    - Authentication,
        - Login (using email/pass and google account)
    - Firestore Database.
        - Add to library,
        - History read
        - View Counts,
        - Rating.
- etc.

#### Notes
- This theme using Firestore database and authentication for login, comments, view counts, and rating. You just need to fill firebase data in hugo.toml.

- Firebase is easy to setup for beginner, just need to click - click and done. There is limitations, but for starter website it's already good deal.

- View counts and rating just show up on home and novel page to optimized usage limitation from firebase. I also use load more to optimized it.

- For settings, you can see ex-hugo.toml for ref,

- Novel page: Download and read in same button, if for read online, keep frontmater `download: ""` like this or just remove it.

-  Novel author using params writer.

## Installation

#### Git Submodule
    git submodule add https://github.com/Ashenara/e-Novel.git themes/e-Novel

    git submodule update --init --recursive
    
#### Update Submodule
    git submodule update --remote
    git add .
    git commit -m "Update submodule e-Novel"
    git push
    
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
        home = ["HTML"]
        section = ["HTML", "JSON"]

## Credits
@hugo-narrow - https://github.com/tom2almighty/hugo-narrow
- prose, chroma, and codeblock style

@admonition - https://github.com/KKKZOZ/hugo-admonitions
- admonition style