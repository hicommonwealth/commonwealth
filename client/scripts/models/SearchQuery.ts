/* eslint-disable prefer-template */
export enum SearchScope {
    "MEMBERS" = "MEMBERS",
    "COMMUNITIES" = "COMMUNITIES",
    "PROPOSALS" = "PROPOSALS",
    "THREADS" = "THREADS",
    "COMMENTS" = "COMMENTS",
    "ALL" = "ALL"
}
export interface SearchParams {
    communityScope?: string;
    chainScope?: string;
    isSearchPreview?: boolean;
    searchScope?: [SearchScope];
    resultSize?: number;
}
export default class SearchQuery implements SearchParams {
    public searchTerm: Lowercase<string>;
    public communityScope?: string;
    public chainScope?: string;
    public isHomepageSearch?: boolean;
    public isSearchPreview?: boolean;
    public searchScope?: [SearchScope];

    constructor(searchTerm: string, params?: SearchParams){
        this.searchTerm = searchTerm
        this.searchScope = params ? params.searchScope || [SearchScope.ALL] : [SearchScope.ALL]
        this.communityScope = params ? params.communityScope : undefined
        this.chainScope = params ? params.chainScope : undefined
        this.isSearchPreview = params ? params.isSearchPreview : false
    }

    public toEncodedString() {
        let encodedString = this.searchTerm +
            (this.communityScope ? ` communityScope=${this.communityScope}` : '') +
            (this.chainScope ? ` chainScope=${this.chainScope}` : '') +
            (this.isSearchPreview ? ` preview=${this.isSearchPreview}` : '')

        for(const scope in this.searchScope){
            if (Object.prototype.hasOwnProperty.call(this.searchScope, scope) &&
                this.searchScope[scope] !== SearchScope.ALL) {
                encodedString += ` scope[]=${this.searchScope[scope]}`
            }
        }

        return encodedString
    }

    public toggleScope(scope: SearchScope) {
        const index = this.searchScope.indexOf(scope)
        if(index > -1){
            this.searchScope.splice(index, 1)
        } else {
            if(this.searchScope.length === 1 && this.searchScope[0] === SearchScope.ALL){
                this.searchScope = [scope]
            } else {
                this.searchScope.push(scope)
            }
        }

        if(this.searchScope.length === 0){
            this.searchScope.push(SearchScope.ALL)
        }
    }

    public toUrlParams(){
        return `q=${this.toEncodedString().trim().replace(/\s+/g, '&')}`
    }

    public static fromUrlParams(url: Record<string, any>){
        const sq = new SearchQuery(url['q'])
        sq.chainScope = url['chainScope'] || undefined
        sq.communityScope = url['communityScope'] || undefined
        sq.isSearchPreview = url['preview'] === 'true'
        sq.searchScope = url['scope'] || [SearchScope.ALL]
        return sq
    }
}