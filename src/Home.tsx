"use strict";

import { useState } from "react";
import { useFF7, FF7 } from "./useFF7";
import { useFF7Context } from "./FF7Context";
import { formatTime } from "./util";
import Row from "./components/Row";
import GroupButton from "./components/GroupButton";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator } from "./components/ui/sidebar";
import { Button } from "./components/ui/button";
import { StatusBar } from "./components/StatusBar";
import { Hacks } from "./Hacks";
import { Tabs } from "./types";
import { QuickActions } from "./QuickActions";
import { General } from "./modules/General";
import { Field } from "./modules/Field";
import { World } from "./modules/World";
import { Battle } from "./modules/Battle";

function Home() {
  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.General);
  const addresses = useFF7Context();

  if (!addresses) {
    return <></>
  }
  const ff7 = useFF7(addresses);

  if (!ff7.gameState) {
    return <></>
  }

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
      default:
        return <General ff7={ff7} />;
    }
    return <></>
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
                    {Object.keys(Tabs).map((item) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton isActive={currentTab === Tabs[item as keyof typeof Tabs]} onClick={() => setCurrentTab(Tabs[item as keyof typeof Tabs])}>
                          {item}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
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
            <h2 className="uppercase font-medium text-sm border-b border-zinc-600 pb-0 mb-2 tracking-wide text-zinc-900 dark:text-zinc-100">
              {currentTab}
            </h2>
            {renderTabContent()}
          </div>
        </div>
        <StatusBar ff7={ff7} />
      </div>
    </SidebarProvider>
  );
}

export default Home;