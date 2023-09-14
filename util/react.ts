export function traverseElement(
  e: React.ReactElement,
  filterCb: (e: React.ReactElement) => boolean
): React.ReactElement | undefined {
  if (e.props) {
    if (Array.isArray(e.props.children)) {
      for (const i of e.props.children) {
        if (filterCb(i)) return i
        let found = traverseElement(i, filterCb)
        if (found) return found
      }
    }
  }
}
