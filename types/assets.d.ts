// Allow importing raw HTML templates as strings (esbuild text loader).
declare module "*.html?raw" {
	const content: string
	export default content
}

declare module "*.html" {
	const content: string
	export default content
}