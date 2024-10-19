# media

The Micropub [media endpoint](https://indieweb.org/micropub_media_endpoint) is not hosted here on GitHub, so the git repository size stays small. Instead, all media assets are hosted on a [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket and publicly reachable at `content.giacomodebidda.com/media`. For example:

[https://content.giacomodebidda.com/media/photos/2024/10/18/el-medano-tenerife-2023.jpg](https://content.giacomodebidda.com/media/photos/2024/10/18/el-medano-tenerife-2023.jpg)

## Testing media assets served from the bucket

The `index.html` file in this directory is a simple HTML page I use to test that media assets are served correctly from the bucket. I typically use the Python's built-in HTTP server to serve it:

```sh
python3 -m http.server --directory media 8080
```

## Alternative solutions

Rather than storing media assets on object storage (e.g.Cloudflare R2, AWS S3), one could use [git LFS](https://git-lfs.com/) and upload media assets to a git LFS server. However, this would be quite involved in my case, because [my Indiekit server](https://github.com/jackdbd/giacomodebidda-indiekit/) makes a POST to the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents), which does not support git LFS. This means that every time I want to upload a media asset, I would need to avoid calling the GitHub Contents API, and call a git LFS server instead. Also, a Cloudflare R2 bucket can be [exposed as a custom subdomain](https://developers.cloudflare.com/r2/buckets/public-buckets/).
