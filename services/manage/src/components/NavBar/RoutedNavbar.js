import { useLocation } from 'react-router-dom'
import { NavbarNested } from './NavbarNested'

const RoutedNavbar = () => {
  const location = useLocation()
  return <NavbarNested active={location.pathname} />
}
export default RoutedNavbar
