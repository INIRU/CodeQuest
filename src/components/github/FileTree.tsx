import { useState, useMemo } from 'react'
import { Folder, FolderOpen, FileText } from 'lucide-react'
import type { GitHubTreeItem } from '@/types'

interface TreeNode {
  name: string
  path: string
  type: 'tree' | 'blob'
  children: TreeNode[]
}

function buildTree(items: GitHubTreeItem[]): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  // Sort: folders first, then alphabetical
  const sorted = [...items].sort((a, b) => {
    const aIsTree = a.type === 'tree' || items.some((x) => x.path.startsWith(a.path + '/'))
    const bIsTree = b.type === 'tree' || items.some((x) => x.path.startsWith(b.path + '/'))
    if (aIsTree && !bIsTree) return -1
    if (!aIsTree && bIsTree) return 1
    return a.path.localeCompare(b.path)
  })

  for (const item of sorted) {
    const parts = item.path.split('/')
    let currentChildren = root
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLast = i === parts.length - 1

      let node = map.get(currentPath)
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isLast ? item.type : 'tree',
          children: [],
        }
        map.set(currentPath, node)
        currentChildren.push(node)
      }
      currentChildren = node.children
    }
  }

  // Sort each level: folders first, then alphabetical
  function sortChildren(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .sort((a, b) => {
        if (a.type === 'tree' && b.type !== 'tree') return -1
        if (a.type !== 'tree' && b.type === 'tree') return 1
        return a.name.localeCompare(b.name)
      })
      .map((n) => ({ ...n, children: sortChildren(n.children) }))
  }

  return sortChildren(root)
}

interface FileTreeNodeProps {
  node: TreeNode
  depth: number
  onSelectFile: (path: string) => void
}

function FileTreeNode({ node, depth, onSelectFile }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1)
  const isFolder = node.children.length > 0 || node.type === 'tree'

  function handleClick() {
    if (isFolder) {
      setExpanded(!expanded)
    } else {
      onSelectFile(node.path)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '4px 8px',
          paddingLeft: depth * 16 + 8,
          border: 'none',
          background: 'transparent',
          color: isFolder ? 'var(--text)' : 'var(--text-sub)',
          fontSize: 13,
          cursor: 'pointer',
          textAlign: 'left',
          borderRadius: 4,
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--glass)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {isFolder ? (
          expanded ? (
            <FolderOpen size={14} color="var(--warning)" />
          ) : (
            <Folder size={14} color="var(--warning)" />
          )
        ) : (
          <FileText size={14} />
        )}
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.name}
        </span>
      </button>
      {isFolder && expanded && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface FileTreeProps {
  items: GitHubTreeItem[]
  onSelectFile: (path: string) => void
}

export default function FileTree({ items, onSelectFile }: FileTreeProps) {
  const tree = useMemo(() => buildTree(items), [items])

  return (
    <div
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        maxHeight: 'calc(100vh - 260px)',
        paddingBottom: 8,
      }}
    >
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  )
}
