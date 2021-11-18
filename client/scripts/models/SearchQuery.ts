export interface SearchParams {
    communityScope?: string;
    chainScope?: string;
    isSearchPreview?: boolean;
    isHomepageSearch?: boolean;
    resultSize?: number;
}

const querytoPropertyMapping = {
    "in-chain": "communityScope",
    "by": "resultsByUser",
    "type": "resultType"
}

export default class SearchQuery implements SearchParams {
    public readonly queryString: string;
    public readonly searchTerm: string;
    public communityScope?: string;
    public chainScope?: string;
    public isSearchPreview?: boolean;
    public isHomepageSearch?: boolean;

    constructor(queryString: string){
        this.queryString = queryString

        let searchTerm = ''
        queryString.split(" ").forEach(i => {
            const colonIndex = i.indexOf(":")
            if(colonIndex !== -1) {
                const property = querytoPropertyMapping[i.substring(0, colonIndex)]
                this[property] = i.substring(colonIndex + 1)
            } else {
                searchTerm += `${i} `
            }
        })
        this.searchTerm = searchTerm.substring(0, searchTerm.length - 1)
    }
}