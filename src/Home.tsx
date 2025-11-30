"use strict";

import { useEffect, useState } from "react";
import { FF7, useFF7 } from "./useFF7";
import { useFF7Context } from "./FF7Context";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator } from "./components/ui/sidebar";
import { StatusBar } from "./components/StatusBar";
import { Hacks } from "./Hacks";
import { Tabs } from "./types";
import { QuickActions } from "./QuickActions";
import { General } from "./modules/General";
import { Field } from "./modules/Field";
import { World } from "./modules/World";
import { Battle } from "./modules/Battle";
import { Party } from "./modules/Party";
import { Chocobos } from "./modules/Chocobos";
import { Variables } from "./modules/Variables";
import { SaveStatesModule } from "./modules/SaveStates";
import { useShortcuts } from './useShortcuts';
import { ChocoboHead } from "./components/icons/ChocoboHead";
import { BinaryGrid } from "./components/icons/BinaryGrid";
import { BusterSword } from "./components/icons/BusterSword";
import { CloudParty } from "./components/icons/CloudParty";
import { 
  Settings2, 
  Map as MapIcon, 
  Globe, 
  Save, 
  LucideIcon 
} from "lucide-react";

const TAB_TITLES: Record<Tabs, string> = {
  [Tabs.General]: "General",
  [Tabs.Field]: "Field",
  [Tabs.World]: "World",
  [Tabs.Battle]: "Battle",
  [Tabs.Party]: "Party",
  [Tabs.Chocobos]: "Chocobos",
  [Tabs.Variables]: "Variables",
  [Tabs.SaveStates]: "Save States",
};

const TAB_ICONS: Record<Tabs, LucideIcon> = {
  [Tabs.General]: Settings2,
  [Tabs.Field]: MapIcon,
  [Tabs.World]: Globe,
  [Tabs.Battle]: BusterSword,
  [Tabs.Party]: CloudParty,
  [Tabs.Chocobos]: ChocoboHead,
  [Tabs.Variables]: BinaryGrid,
  [Tabs.SaveStates]: Save,
};

function Home() {
  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.General);
  const { addresses } = useFF7Context();

  if (!addresses) {
    return <></>
  }
  const ff7 = useFF7(addresses);

  // For debugging purposes
  ((window as unknown) as any).FF7 = ff7;

  if (!ff7.gameState) {
    return <></>
  }

  // Use the new shortcuts system
  useShortcuts();

  const renderTabContent = () => {
    switch (currentTab) {
      case Tabs.General:
        return <General ff7={ff7} />;
      case Tabs.Field:
        return <Field ff7={ff7} />;
      case Tabs.World:
        return <World ff7={ff7} />;
      case Tabs.Battle:
        return <Battle ff7={ff7} />;
      case Tabs.Party:
        return <Party ff7={ff7} />;
      case Tabs.Chocobos:
        return <Chocobos ff7={ff7} />;
      case Tabs.Variables:
        return <Variables ff7={ff7} />;
      case Tabs.SaveStates:
        return <SaveStatesModule ff7={ff7} />;
      default:
        return <General ff7={ff7} />;
    }
  };

  return (
    <SidebarProvider className="h-full">
      <div className="flex flex-col w-full text-sm">
        <div className="flex-auto flex min-h-10">
          <Sidebar collapsible="none" className="flex-shrink-0">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {Object.values(Tabs).map((tab) => {
                      const Icon = TAB_ICONS[tab];
                      return (
                        <SidebarMenuItem key={tab}>
                          <SidebarMenuButton isActive={currentTab === tab} onClick={() => setCurrentTab(tab)}>
                            <Icon />
                            <span>{TAB_TITLES[tab]}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarSeparator />
              <SidebarGroup className="-mt-3">
                <SidebarGroupLabel>Generic Hacks & Tweaks</SidebarGroupLabel>
                <SidebarGroupContent>
                  <Hacks ff7={ff7} tab={currentTab} />
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
              <QuickActions ff7={ff7} />
            </SidebarFooter>
          </Sidebar>
          <div className="p-2 overflow-y-auto flex-auto">
            {currentTab !== Tabs.SaveStates && (
              <h2 className="uppercase font-medium text-sm border-b border-zinc-600 pb-0 mb-2 tracking-wide text-zinc-900 dark:text-zinc-100">
                {TAB_TITLES[currentTab]}
              </h2>
            )}
            {renderTabContent()}
          </div>
        </div>
        <StatusBar ff7={ff7} />
      </div>
    </SidebarProvider>
  );
}

export default Home;
