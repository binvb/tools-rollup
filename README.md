### rollup plugin try catch
Automatically insert try catch into source code;

### installation
```
yarn add plugin-trycatch
// or
npm install plugin-trycatch
```

### usage
```
import plugin-trycatch from 'rollup-plugin-trycatch'

export default {
  ...
  plugins: [
    rollup-plugin-trycatch({
                'catchCode': () => `console.log(e)`
        }
    }),
  ],
  ...
}
```