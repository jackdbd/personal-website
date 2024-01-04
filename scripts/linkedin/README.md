# LinkedIn scripts

## Searches

Perform searches on LinkedIn using the [Steampipe LinkedIn plugin](https://hub.steampipe.io/plugins/turbot/linkedin).

Search companies using the Steampipe query [linkedin-companies.sql](../../assets/steampipe-queries/linkedin-companies.sql):

```sh
node scripts/linkedin/linkedin-companies-links.cjs
```

Search people using the Steampipe query [linkedin-people.sql](../../assets/steampipe-queries/linkedin-people.sql):

```sh
node scripts/linkedin/linkedin-people-links.cjs
```
