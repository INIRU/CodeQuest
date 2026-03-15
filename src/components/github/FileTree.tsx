import { useState, useMemo } from 'react'
import { Folder, FolderOpen, FileText, Check, Minus } from 'lucide-react'
import type { GitHubTreeItem } from '@/types'

/** File extensions considered as code files for multi-select filtering */
const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h',
  'rb', 'swift', 'kt', 'php', 'css', 'html', 'md', 'json', 'yml', 'yaml',
  'sh', 'bash', 'sql', 'toml', 'xml', 'cs', 'cc', 'vue', 'svelte', 'scss',
  'less', 'graphql', 'gql', 'proto', 'dart', 'lua', 'r', 'scala', 'zig',
])

/** Paths/patterns to exclude from multi-select */
const EXCLUDE_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  '.git/',
  'vendor/',
  '__pycache__/',
  '.next/',
  '.nuxt/',
  'coverage/',
  '.cache/',
]

const EXCLUDE_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'composer.lock',
  'Gemfile.lock',
  'Cargo.lock',
  'poetry.lock',
])

function isCodeFile(path: string): boolean {
  const filename = path.split('/').pop() ?? ''
  if (EXCLUDE_FILES.has(filename)) return false
  if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) return false
  if (EXCLUDE_PATTERNS.some((p) => path.includes(p))) return false
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return CODE_EXTENSIONS.has(ext)
}

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

/** Collect all file (blob) paths under a tree node */
function collectFilePaths(node: TreeNode): string[] {
  if (node.children.length === 0 && node.type !== 'tree') {
    return [node.path]
  }
  return node.children.flatMap(collectFilePaths)
}

/** Get checkbox state for a folder: 'all', 'some', or 'none' */
function getFolderCheckState(
  node: TreeNode,
  selectedFiles: Set<string>,
  codeFilePaths: Set<string>,
): 'all' | 'some' | 'none' {
  const childFiles = collectFilePaths(node).filter((p) => codeFilePaths.has(p))
  if (childFiles.length === 0) return 'none'
  const selectedCount = childFiles.filter((p) => selectedFiles.has(p)).length
  if (selectedCount === 0) return 'none'
  if (selectedCount === childFiles.length) return 'all'
  return 'some'
}

interface CheckboxProps {
  state: 'all' | 'some' | 'none'
  onClick: (e: React.MouseEvent) => void
}

function Checkbox({ state, onClick }: CheckboxProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 16,
        height: 16,
        minWidth: 16,
        borderRadius: 3,
        border: `1.5px solid ${state !== 'none' ? 'var(--primary)' : 'var(--border)'}`,
        backgroundColor: state !== 'none' ? 'var(--primary)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {state === 'all' && <Check size={10} color="white" strokeWidth={3} />}
      {state === 'some' && <Minus size={10} color="white" strokeWidth={3} />}
    </button>
  )
}

interface FileTreeNodeProps {
  node: TreeNode
  depth: number
  onSelectFile: (path: string) => void
  multiSelect?: boolean
  selectedFiles?: Set<string>
  onToggleFile?: (path: string) => void
  onToggleFolder?: (paths: string[], select: boolean) => void
  codeFilePaths?: Set<string>
}

function FileTreeNode({
  node,
  depth,
  onSelectFile,
  multiSelect,
  selectedFiles,
  onToggleFile,
  onToggleFolder,
  codeFilePaths,
}: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1)
  const isFolder = node.children.length > 0 || node.type === 'tree'
  const isFile = !isFolder
  const isCodeFileNode = isFile && codeFilePaths?.has(node.path)

  function handleClick() {
    if (isFolder) {
      setExpanded(!expanded)
    } else {
      onSelectFile(node.path)
    }
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (isFile && onToggleFile) {
      onToggleFile(node.path)
    } else if (isFolder && onToggleFolder && selectedFiles && codeFilePaths) {
      const folderState = getFolderCheckState(node, selectedFiles, codeFilePaths)
      const childCodeFiles = collectFilePaths(node).filter((p) => codeFilePaths.has(p))
      // If all or some selected, deselect all. If none, select all.
      onToggleFolder(childCodeFiles, folderState === 'none')
    }
  }

  const folderCheckState =
    isFolder && selectedFiles && codeFilePaths
      ? getFolderCheckState(node, selectedFiles, codeFilePaths)
      : 'none'

  const isSelected = isFile && selectedFiles?.has(node.path)

  // In multi-select mode, hide non-code files
  if (multiSelect && isFile && !isCodeFileNode) {
    return null
  }

  // In multi-select mode, hide folders that have no code file descendants
  if (multiSelect && isFolder && codeFilePaths) {
    const hasCodeDescendants = collectFilePaths(node).some((p) => codeFilePaths.has(p))
    if (!hasCodeDescendants) return null
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          paddingLeft: depth * 16 + 8,
        }}
      >
        {multiSelect && (isCodeFileNode || isFolder) && (
          <Checkbox
            state={isFile ? (isSelected ? 'all' : 'none') : folderCheckState}
            onClick={handleCheckboxClick}
          />
        )}
        <button
          onClick={handleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 1,
            padding: '4px 8px',
            border: 'none',
            background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
            color: isFolder ? 'var(--text)' : 'var(--text-sub)',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: 4,
            transition: 'background-color 0.1s',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'var(--glass)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isSelected
              ? 'rgba(99, 102, 241, 0.08)'
              : 'transparent'
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
      </div>
      {isFolder && expanded && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelectFile={onSelectFile}
              multiSelect={multiSelect}
              selectedFiles={selectedFiles}
              onToggleFile={onToggleFile}
              onToggleFolder={onToggleFolder}
              codeFilePaths={codeFilePaths}
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
  multiSelect?: boolean
  selectedFiles?: Set<string>
  onToggleFile?: (path: string) => void
  onToggleFolder?: (paths: string[], select: boolean) => void
}

export default function FileTree({
  items,
  onSelectFile,
  multiSelect,
  selectedFiles,
  onToggleFile,
  onToggleFolder,
}: FileTreeProps) {
  const tree = useMemo(() => buildTree(items), [items])

  // Build set of code file paths for filtering
  const codeFilePaths = useMemo(() => {
    const paths = new Set<string>()
    for (const item of items) {
      if (item.type === 'blob' && isCodeFile(item.path)) {
        paths.add(item.path)
      }
    }
    return paths
  }, [items])

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
          multiSelect={multiSelect}
          selectedFiles={selectedFiles}
          onToggleFile={onToggleFile}
          onToggleFolder={onToggleFolder}
          codeFilePaths={codeFilePaths}
        />
      ))}
    </div>
  )
}

/** Export helper to get all code file paths from tree items */
export function getCodeFilePaths(items: GitHubTreeItem[]): string[] {
  return items
    .filter((item) => item.type === 'blob' && isCodeFile(item.path))
    .map((item) => item.path)
}
