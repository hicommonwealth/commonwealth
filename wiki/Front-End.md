This wiki page is intended to document our development setup across Production and Local dev (as well as testing & QA servers.) 

For example, we need to memorialize how we are using Terser in production, to reduce reduce bundle size (and so, FCP) whereas for local dev, we don't use Terser because that bundle size reduction comes at the expense of doubling build time, which can be annoying in the current setup. 

Conversely, we don't use the cssMinimize plugin in production because it overrides Terser and so increases bundle size. Zhus far we are not able to use Terser and cssMinimize together. 