import { IUniqueId } from './interfaces';

export default class SearchResult implements IUniqueId   {
    public readonly term: string;
    public loaded: boolean;
    public results: Record<string, Array<Record<string, unknown>>>
    public readonly identifier: string;
    public readonly uniqueIdentifier: string;
    public readonly slug: string;
    public readonly id: number;

    constructor(term: string){
        this.term = term
        this.loaded = false
        this.identifier = term
        this.uniqueIdentifier = term
        this.slug = term
        // Hash term into number id which seems to be required for IUniqueId interface
        // eslint-disable-next-line no-bitwise
        this.id = term.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)
    }
}