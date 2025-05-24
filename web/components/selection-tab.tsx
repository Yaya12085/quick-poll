import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

interface SelectionTabsProps {
  options: { key: string; label: string }[];
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}
export function SelectionTabs({
  options,
  currentTab,
  setCurrentTab,
}: SelectionTabsProps) {
  return (
    <Tabs
      defaultValue={currentTab}
      className="w-full bg-background flex gap-2 rounded-lg"
    >
      <TabsList className="flex justify-start w-full bg-background">
        {options.map((list) => {
          return (
            <TabsTrigger
              key={list.key}
              value={list.key}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => setCurrentTab(list.key)}
            >
              {list.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
