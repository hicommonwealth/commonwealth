/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

export class JoinCommonWealthSection extends ClassComponent {
  view() {
    return (
      <section class="h-80 bg-gray-900 flex items-center mt-20 h-56">
        <div class="container mx-auto">
          <div class="flex flex-col md:flex-row md:justify-between">
            <div>
              <h2 class="text-white font-bold text-3xl">
                A community for every token.
              </h2>
              <p class="text-xl text-gray-400">Join Commonwealth today.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
