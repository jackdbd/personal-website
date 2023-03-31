# LinkedIn scripts

## Searches

Perform searches on LinkedIn using the [Steampipe LinkedIn plugin](https://hub.steampipe.io/plugins/turbot/linkedin).

Search [companies](https://hub.steampipe.io/plugins/turbot/linkedin/tables/linkedin_search_company) using the Steampipe query [linkedin-companies.sql](../../assets/steampipe-queries/linkedin-companies.sql):

```sh
node scripts/linkedin/linkedin-companies-links.cjs
```

Search [people](https://hub.steampipe.io/plugins/turbot/linkedin/tables/linkedin_search_profile) using the Steampipe query [linkedin-people.sql](../../assets/steampipe-queries/linkedin-people.sql):

```sh
node scripts/linkedin/linkedin-people-links.cjs
```
