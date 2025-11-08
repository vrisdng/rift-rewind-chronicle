/**
 * CSS filter values for each element to transform the orange YouTube video
 * to match the element's color theme
 */
export const ELEMENT_FILTERS: Record<string, string> = {
	// Red hue - rotate from orange (~30deg) to red (~0deg)
	Inferno: "hue-rotate(-30deg) saturate(1.3) brightness(0.9)",

	// Teal hue - rotate to cyan/teal (~180deg from orange)
	Tide: "hue-rotate(150deg) saturate(1.2) brightness(0.85)",

	// Gray-blue hue - rotate to blue and desaturate
	Gale: "hue-rotate(210deg) saturate(0.6) brightness(0.8)",

	// Purple hue - rotate to purple (~270deg from red, so ~240deg from orange)
	Void: "hue-rotate(240deg) saturate(1.4) brightness(0.85)",

	// Brown/yellow hue - slight rotation and desaturation
	Terra: "hue-rotate(20deg) saturate(0.8) brightness(0.85) sepia(0.3)",
};

/**
 * Get CSS filter for an element name
 */
export function getElementFilter(elementName: string): string {
	return ELEMENT_FILTERS[elementName] || "";
}
