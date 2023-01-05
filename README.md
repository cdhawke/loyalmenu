# loyalmenu

Node script to parse the Loyal menu pdf and post it to a slack channel

## Usage

```sh
npm i
```

### Building and publishing

Make sure you're logged in to aws via sso with `aws sso login` under the correct account / profile.

```sh
npm run build && npm run package && npm run publish
```
