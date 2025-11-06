# jpdb.io tweaks

Simple tweaks for [jpdb.io](https://jpdb.io), a Japanese dictionary and spaced repetition system. If jpdb.io makes breaking changes to their UI and this extension stops working, please open an issue!

- Adds copy markdown button to example sentences
- Shows the first Bing images result on the back side of cards without an image \
  (disabled by default, enable in settings)

  **Warning:** Be aware that Bing's SafeSearch is far from perfect and if you have cards that may result in NSFW search results, there's a small but non-zero chance you might see something unpleasant on your cards. You've been warned.

### Copy markdown button

Example output:

```
> あの\ **[猫]{ねこ}**\ は、[僕]{ぼく}の[横]{よこ}で[寝]{ね}るのが[好]{す}きなんだ。
> The cat likes to sleep beside me.
```

The [CommonMark specification for Markdown](https://spec.commonmark.org/0.31.2/) does not have an official syntax for furigana, so this extension copies furigana with my own custom syntax, where <ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp></ruby><ruby>字<rp>(</rp><rt>じ</rt><rp>)</rp></ruby> is formatted as `[漢]{かん}[字]{じ}`.

In order for it to render properly, you'll have to add this formatting to your website's rendering pipeline. This can be achieved using a simple regular expression. If you are using [Hugo](https://gohugo.io), add the following to your page template where you render the `.Content` of the page:

```GO
{{
    .Content
    | replaceRE `\[([^\]]*)\]{([^\}]*)}` `<ruby lang="ja">$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>`
    | safeHTML
}}
```

The escaped spaces `\ ` around the bolded key vocabulary word is necessary, because otherwise the Markdown syntax won't work. If you are using Hugo, ensure that the `cjk` extension for goldmark is enabled with `escapedSpace` on in your hugo.toml:

```TOML
[markup]
  [markup.goldmark.extensions.cjk]
    enable = true
    escapedSpace = true
```
