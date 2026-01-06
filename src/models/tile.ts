export interface Tile {
    id: number;
    image: string;
    alt: string;
    description: string;
    tooltip?: string;
    locked?: boolean;
    checked?: boolean;
    challenge?: boolean;
    fun?: boolean;
    weight: number;
}