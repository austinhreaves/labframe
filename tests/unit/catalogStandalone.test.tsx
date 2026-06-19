import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Course, Lab } from '@/domain/schema';
import { Catalog } from '@/ui/Catalog';

const lab: Lab = {
  id: 'lab1',
  title: 'Lab One',
  description: '',
  category: 'Custom',
  simulations: {},
  sections: [{ kind: 'instructions', html: 'Hi' }],
};

const course: Course = {
  id: 'phyX',
  title: 'PHY X',
  storagePrefix: 'phyX',
  parentOriginAllowList: [],
  labs: [{ ref: 'lab1', enabled: true, labNumber: 1 }],
};

const labsByCourse = { phyX: { lab1: lab } };

function renderStandalone() {
  return render(
    <MemoryRouter initialEntries={['/c/phyX']}>
      <Catalog courses={[course]} labsByCourse={labsByCourse} showWizard={false} standalone />
    </MemoryRouter>,
  );
}

describe('Catalog standalone course page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the hero figure and a course-scoped two-step wizard', () => {
    const { container } = renderStandalone();

    // Hero illustration is ported over from the main landing page.
    expect(container.querySelector('.catalog-hero-figure .hero-art')).toBeTruthy();

    // Wizard is present and collapsed to Name -> Lab (no Course step).
    expect(screen.getByRole('heading', { name: 'Start a lab' })).toBeInTheDocument();
    const steps = [...container.querySelectorAll('.wizard-steps li')].map((li) =>
      li.textContent?.replace(/^\d+/, ''),
    );
    expect(steps).toEqual(['Name', 'Lab']);
  });

  it('threads the student name into the chosen lab link and skips course selection', async () => {
    const user = userEvent.setup();
    const { container } = renderStandalone();

    await user.type(screen.getByLabelText('Student name'), 'Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /Continue/ }));

    // Lands directly on the Lab step (course was pre-selected). Scope to the
    // wizard: the browsable course grid below carries the same lab title.
    await waitFor(() => {
      expect(container.querySelector('.catalog-wizard-cards a')).toBeTruthy();
    });
    const labLink = container.querySelector('.catalog-wizard-cards a');
    expect(labLink).toHaveAttribute('href', '/c/phyX/lab1?student=Ada%20Lovelace');

    // Back returns to Name, not a (nonexistent) Course step.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Student name')).toBeInTheDocument();
    });
  });
});
