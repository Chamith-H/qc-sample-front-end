import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleMessureComponent } from './sample-messure.component';

describe('SampleMessureComponent', () => {
  let component: SampleMessureComponent;
  let fixture: ComponentFixture<SampleMessureComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SampleMessureComponent]
    });
    fixture = TestBed.createComponent(SampleMessureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
