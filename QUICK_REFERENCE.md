# 🚀 shadcn/ui Quick Reference

## Import Statements

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
```

## Button Examples

```tsx
// Variants
<Button>Default (Primary)</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Menu</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="link">Learn More</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>

// With Icons
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>
```

## Card Examples

```tsx
// Basic Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Menu Item Card
<Card className="overflow-hidden hover:shadow-xl transition-all">
  <img src={image} className="w-full h-48 object-cover" />
  <CardContent className="p-6">
    <CardTitle>{name}</CardTitle>
    <p className="text-sm text-muted-foreground">{description}</p>
    <p className="text-2xl font-bold text-primary">${price}</p>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Add to Cart</Button>
  </CardFooter>
</Card>
```

## Form Fields

```tsx
// Text Input
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input
    id="name"
    placeholder="Enter name"
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
</div>

// Textarea
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    placeholder="Enter description"
    rows={4}
  />
</div>

// Number Input
<Input
  type="number"
  step="0.01"
  placeholder="0.00"
/>

// File Input (Hidden)
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleFile}
  className="hidden"
/>
<Button onClick={() => fileInputRef.current?.click()}>
  Upload
</Button>
```

## Badges

```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>

// With Icons
<Badge variant="success">
  <Check className="w-3 h-3 mr-1" />
  Delivered
</Badge>
```

## Progress Bar

```tsx
const [progress, setProgress] = useState(0);

<Progress value={progress} />
<p className="text-sm text-muted-foreground">
  {progress}% complete
</p>
```

## Common Layouts

```tsx
// Two-Column Form
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-2">
    <Label>Field 1</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Field 2</Label>
    <Input />
  </div>
</div>

// Card Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// Flex Layout
<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
  <div>Content</div>
  <Button>Action</Button>
</div>
```

## Color System

```tsx
// Text Colors
text-foreground              // Primary text
text-muted-foreground        // Secondary text
text-primary                 // Emerald green
text-destructive             // Red

// Background Colors
bg-background                // Page bg
bg-card                      // Card bg
bg-muted                     // Subtle bg
bg-primary                   // Emerald
bg-destructive               // Red

// Border Colors
border-border                // Default
border-input                 // Input
border-primary               // Emerald
```

## Spacing

```tsx
// Padding
p-4    p-6    p-8              // All sides
px-6   py-4                    // Horizontal/Vertical

// Margin
m-4    m-6    m-8
mx-auto                        // Center
my-8                           // Vertical only

// Gap (Flex/Grid)
gap-4  gap-6  gap-8

// Space Between
space-y-4  space-y-6  space-y-8   // Vertical
space-x-4  space-x-6  space-x-8   // Horizontal
```

## Typography

```tsx
// Headings
text-3xl font-bold tracking-tight   // Page title
text-2xl font-bold                  // Section
text-xl font-semibold               // Card title
text-lg font-medium                 // Subsection

// Body
text-base                           // Normal
text-sm                             // Secondary
text-xs                             // Caption

// Weight
font-normal  font-medium  font-semibold  font-bold
```

## Shadows & Borders

```tsx
// Shadows
shadow-sm                    // Subtle
shadow-md                    // Default
shadow-lg                    // Elevated
hover:shadow-xl              // Hover effect

// Border Radius
rounded-lg                   // 0.5rem
rounded-xl                   // 0.75rem
rounded-2xl                  // 1rem
rounded-full                 // Circle

// Borders
border                       // 1px solid
border-2                     // 2px solid
border-dashed                // Dashed style
```

## Animations

```tsx
// Transitions
transition-all duration-300
transition-colors
transition-shadow

// Hover Effects
hover:bg-accent
hover:text-accent-foreground
hover:shadow-lg
hover:scale-105

// Active States
active:scale-[0.98]          // Press effect
```

## Responsive Design

```tsx
// Breakpoints
sm:   // 640px
md:   // 768px
lg:   // 1024px
xl:   // 1280px
2xl:  // 1536px

// Examples
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div className="text-2xl md:text-3xl lg:text-4xl">
<div className="p-4 md:p-6 lg:p-8">
<div className="hidden md:block">              // Show on desktop
<div className="md:hidden">                    // Show on mobile
```

## cn() Helper

```tsx
import { cn } from "@/lib/utils";

// Merge classes safely
<div className={cn(
  "base classes",
  condition && "conditional classes",
  "more classes"
)} />

// Example
<Button className={cn(
  "w-full",
  isLoading && "opacity-50 cursor-not-allowed",
  variant === "large" && "h-14 text-lg"
)} />
```

## File Upload with Preview

```tsx
const [imagePreview, setImagePreview] = useState('');
const [uploading, setUploading] = useState(false);
const [progress, setProgress] = useState(0);
const fileInputRef = useRef<HTMLInputElement>(null);

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }
};

<div className="space-y-4">
  {/* Upload Area */}
  <div
    onClick={() => fileInputRef.current?.click()}
    className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition cursor-pointer"
  >
    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
    <p className="text-sm font-medium">Click to upload</p>
  </div>

  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleFileSelect}
    className="hidden"
  />

  {/* Progress */}
  {uploading && (
    <div className="space-y-2">
      <Progress value={progress} />
      <p className="text-sm text-muted-foreground text-center">
        {progress}% uploaded
      </p>
    </div>
  )}

  {/* Preview */}
  {imagePreview && (
    <div className="relative rounded-xl overflow-hidden border-2">
      <img src={imagePreview} className="w-full h-48 object-cover" />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => setImagePreview('')}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )}
</div>
```

## Loading States

```tsx
// Button Loading
<Button disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</Button>

// Spinner
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
</div>

// Skeleton Loader
<div className="space-y-4">
  <div className="h-4 bg-muted rounded animate-pulse" />
  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
</div>
```

## Empty States

```tsx
<Card>
  <CardContent className="p-16 text-center">
    <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
    <CardTitle className="mb-2">No items yet</CardTitle>
    <p className="text-sm text-muted-foreground mb-6">
      Get started by adding your first item
    </p>
    <Button>Add Item</Button>
  </CardContent>
</Card>
```

## Status Indicators

```tsx
// Order Status
const statusConfig = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'default', label: 'Confirmed' },
  preparing: { variant: 'default', label: 'Preparing' },
  ready: { variant: 'success', label: 'Ready' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

<Badge variant={statusConfig[order.status].variant}>
  {statusConfig[order.status].label}
</Badge>
```

---

**Quick Start**: Copy any example above and customize for your needs!
**Full Docs**: See `MODERNIZATION_COMPLETE.md` for detailed guides
**Components**: All components are in `src/components/ui/`
