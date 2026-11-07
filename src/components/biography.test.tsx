import { fireEvent, render, screen } from "@testing-library/react";
import { Biography } from "./biography";

const text = "Clinton Eastwood Jr. is an American actor.\n\nHe rose to fame in the Dollars trilogy.";

/** jsdom has no layout, so stub the heights the overflow check reads. */
function stubHeights(scrollHeight: number, clientHeight: number) {
  const proto = HTMLElement.prototype;
  const scroll = vi.spyOn(proto, "scrollHeight", "get").mockReturnValue(scrollHeight);
  const client = vi.spyOn(proto, "clientHeight", "get").mockReturnValue(clientHeight);
  return () => {
    scroll.mockRestore();
    client.mockRestore();
  };
}

describe("Biography", () => {
  let restore: (() => void) | undefined;
  afterEach(() => restore?.());

  it("keeps TMDB's paragraph breaks", () => {
    restore = stubHeights(100, 100);
    render(<Biography text={text} />);
    const body = screen.getByText(/Clinton Eastwood Jr\./);
    expect(body.textContent).toBe(text);
    expect(body).toHaveClass("whitespace-pre-line");
  });

  it("shows no toggle when the clamped text fits", () => {
    restore = stubHeights(96, 96);
    render(<Biography text={text} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("expands and collapses the text in place when it overflows", () => {
    restore = stubHeights(240, 96);
    render(<Biography text={text} />);
    const body = screen.getByText(/Clinton Eastwood Jr\./);
    const button = screen.getByRole("button", { name: "Read more" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", body.id);
    expect(body).toHaveClass("line-clamp-4");

    fireEvent.click(button);
    expect(button).toHaveAccessibleName("Show less");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(body).not.toHaveClass("line-clamp-4");

    fireEvent.click(button);
    expect(button).toHaveAccessibleName("Read more");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(body).toHaveClass("line-clamp-4");
  });
});
