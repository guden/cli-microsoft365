# spo cdn get

View current status of the specified Microsoft 365 CDN

## Usage

```sh
m365 spo cdn get [options]
```

## Options

`-t, --type [type]`
: Type of CDN to manage. Allowed values `Public`, `Private`. Default `Public`.

--8<-- "docs/cmd/_global.md"

## Remarks

Using the `-t, --type` option you can choose whether you want to manage the settings of the Public (default) or Private CDN. If you don't use the option, the command will use the Public CDN.

!!! important
    To use this command you have to have permissions to access the tenant admin site.

## Examples

Show if the Public CDN is currently enabled or not.

```sh
m365 spo cdn get
```

Show if the Private CDN is currently enabled or not.

```sh
m365 spo cdn get --type Private
```

## More information

- Use Microsoft 365 CDN with SharePoint Online: [https://learn.microsoft.com/microsoft-365/enterprise/use-microsoft-365-cdn-with-spo?view=o365-worldwide](https://learn.microsoft.com/microsoft-365/enterprise/use-microsoft-365-cdn-with-spo?view=o365-worldwide)
