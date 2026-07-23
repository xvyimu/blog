// Blog index + tag/category list shells share BlogCard / SearchBar styles.
// Article detail CSS is mounted under blog/[slug]/layout.tsx.
import '../styles/search-ui.css';
import '../styles/blog-ui.css';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
